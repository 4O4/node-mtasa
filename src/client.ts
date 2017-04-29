import { AuthOptions } from "request";
import { post } from "request-promise";

export type Protocol = "http" | "https";

export class Client<R extends object = any> {
    /**
     * Virtual resources object.
     *
     * Using this, it's possible to do:
     *   client.resources.resource_name.procedureName()
     *
     * instead of:
     *   client.call("resource_name", "procedureName")
     *
     * @type {R}
     * @memberof Client
     */
    public resources: R = {} as R;

    /**
     * Creates an instance of Client.
     * @param {string} [host="127.0.0.1"] Domain name or IP address of the MTA server
     * @param {number} [port=22005] Port of the MTA server
     * @param {string} [user=null] Username used for authentication during procedure calls
     * @param {string} [password=null] Password used for authentication during procedure calls
     * @param {Protocol} [protocol="http"] Web protocol used for procedure calls
     *
     * @memberof Client
     */
    constructor(
        private host: string = "127.0.0.1",
        private port: number = 22005,
        private user: string = null,
        private password: string = null,
        private protocol: Protocol = "http",
    ) {
        this.resources = this.createResourcesProxy();
    }

    /**
     * Performs a call to the remote server.
     *
     * @template A Response
     * @template T Resource name
     * @template R Resources interface
     * @param {T} resourceName Name of the resource to call the procedure from
     * @param {keyof R[T]} procedureName Name of the procedure from the resource to call
     * @param {...any[]} args Parameters to pass to the procedure being called
     * @returns {Promise<A>} Result of the procedure call
     *
     * @memberof Client
     */
    public async call<A, T extends keyof R = keyof R>(
        resourceName: T,
        procedureName: keyof R[T],
        ...args: any[],
    ): Promise<A> {
        const uri = `${this.serverUri}/${resourceName}/call/${procedureName}`;
        const result = await post({
            uri,
            auth: this.authOptions,
            headers: {
                "Content-type": "application/json",
                "User-Agent": this.userAgent,
            },
            json: true,
            body: args,
        });

        return result[0];
    }

    /**
     * URI of the MTA server's HTTP server
     *
     * @readonly
     * @private
     * @type {string}
     * @memberof Client
     */
    private get serverUri(): string {
        return `${this.protocol}://${this.host}:${this.port}`;
    }

    /**
     * Internal user agent
     *
     * @readonly
     * @private
     * @type {string}
     * @memberof Client
     */
    private get userAgent(): string {
        return `MTA:SA WEB client on Node.js ${process.version} (node-mtasa)`;
    }

    /**
     * Request authentication options, or undefined
     * when username or password is missing.
     *
     * @readonly
     * @private
     * @type {AuthOptions}
     * @memberof Client
     */
    private get authOptions(): AuthOptions {
        let opts: AuthOptions;

        if (this.user && this.password) {
            opts = {
                user: this.user,
                password: this.password,
            };
        }

        return opts;
    }

    /**
     * Creates a proxy for handling virtual resources.
     *
     * @private
     * @returns {object}
     *
     * @memberof Client
     */
    private createResourcesProxy() {
        return new Proxy(this.resources, {
            get: (target, resourceName: string) => {
                return this.createProceduresProxy(resourceName);
            },
        });
    }

    /**
     * Creates a proxy for handling virtual procedures.
     *
     * @private
     * @param {string} resourceName
     * @returns {object}
     *
     * @memberof Client
     */
    private createProceduresProxy(resourceName: string) {
        return new Proxy({}, {
            get: (target, procedureName: string) => {
                return (...args: any[]) => {
                    return this.call(resourceName as any, procedureName, ...args);
                };
            },
        });
    }
}
