import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as request from "request-promise";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { Client } from "../src/client";

use(sinonChai);
use(chaiAsPromised);

describe("client", () => {
    beforeEach(() => {
        this.postSpy = sinon.spy(() => {
            return Promise.resolve([
                "Yo, I'm the first element of the response",
                "I'm always second :(",
            ]);
        });
        sinon.stub(request, "post").callsFake(this.postSpy);
    });

    afterEach(() => {
        (request.post as sinon.SinonStub).restore();
    });

    it("should call procedures on local server with no authentication by default", async () => {
        const mta = new Client();
        const result = await mta.call("test_resource", "testProcedure");

        expect(this.postSpy).to.have.been.calledWithMatch({
            uri: sinon.match(/.*?\/\/127.0.0.1:22005\/test_resource\/call\/testProcedure/),
            auth: sinon.match.falsy,
        });
    });

    it("should call procedures on specified remote server", async () => {
        const mta = new Client("1.1.1.1", 12345);
        const result = await mta.call("test_resource", "testProcedure");

        expect(this.postSpy).to.have.been.calledWithMatch({
            uri: sinon.match(/.*?\/\/1.1.1.1:12345\/test_resource\/call\/testProcedure/),
        });
    });

    describe("should allow to configure", () => {
        it("host", async () => {
            const mta = new Client("1.1.1.1");
            const result = await mta.call("test_resource", "testProcedure");

            expect(this.postSpy).to.have.been.calledWithMatch({
                uri: sinon.match(/.*?\/\/1.1.1.1:.*?/),
            });
        });

        it("port", async () => {
            const mta = new Client(null, 12121);
            const result = await mta.call("test_resource", "testProcedure");

            expect(this.postSpy).to.have.been.calledWithMatch({
                uri: sinon.match(/.*?:12121\/.*?/),
            });
        });

        it("username and password", async () => {
            const mta = new Client(null, null, "test-user", "test-pass");
            const result = await mta.call("test_resource", "testProcedure");

            expect(this.postSpy).to.have.been.calledWithMatch({
                auth: {
                    user: "test-user",
                    password: "test-pass",
                },
            });
        });

        it("protocol", async () => {
            const mta = new Client(null, null, null, null, "https");
            const result = await mta.call("test_resource", "testProcedure");

            expect(this.postSpy).to.have.been.calledWithMatch({
                uri: sinon.match(/^https:\/\/.*?/),
            });
        });
    });

    describe("when calling procedures", () => {
        it("should use JSON", async () => {
            const mta = new Client();
            const result = await mta.call("test_resource", "testProcedure");

            expect(this.postSpy).to.have.been.calledWithMatch({
                headers: {
                    "Content-type": "application/json",
                },
                json: true,
            });
        });

        it("should identify itself with user-agent", async () => {
            const mta = new Client();
            const result = await mta.call("test_resource", "testProcedure");

            expect(this.postSpy).to.have.been.calledWithMatch({
                headers: {
                    "User-Agent": sinon.match(/.*? \(node-mtasa\)$/),
                },
            });
        });

        // Unwrapping useless one-element-array produced by MTA's JSON API
        it("should always return first element of the response array as the final result", async () => {
            const mta = new Client();
            const result = await mta.call("test_resource", "testProcedure");

            expect(result).to.eql("Yo, I'm the first element of the response");
        });

        it("should authenticate if username and password was given", async () => {
            const mta = new Client(null, null, "user", "pass");
            const result = await mta.call("test_resource", "testProcedure");

            expect(this.postSpy).to.have.been.calledWithMatch({
                auth: {
                    user: "user",
                    password: "pass",
                },
            });
        });

        it("should NOT authenticate if only username was given", async () => {
            const mta = new Client(null, null, "user");
            const result = await mta.call("test_resource", "testProcedure");

            expect(this.postSpy).to.have.been.calledWithMatch({
                auth: sinon.match.falsy,
            });
        });

        it("should NOT authenticate if only password was given", async () => {
            const mta = new Client(null, null, null, "pass");
            const result = await mta.call("test_resource", "testProcedure");

            expect(this.postSpy).to.have.been.calledWithMatch({
                auth: sinon.match.falsy,
            });
        });

        it("should send an array of parameters", async () => {
            const mta = new Client();
            const result = await mta.call("test_resource", "testProcedure", "test1", "test2", "Test3");

            expect(this.postSpy).to.have.been.calledWithMatch({
                body: ["test1", "test2", "Test3"],
            });
        });
    });

    it("should allow to perform calls with client.resources.resource_name.procedureName syntax", async () => {
        const mta = new Client();
        const spy = sinon.spy(mta, "call");

        expect(mta.resources.test_res).to.be.ok;
        expect(mta.resources.test_res.testProc).to.be.ok;
        expect(mta.resources.test_res.anotherProcedure).to.be.ok;
        expect(mta.resources.another_resource.anotherProcedure).to.be.ok;
        expect(mta.resources.test_res.testProc("testarg1", "testarg2"))
            .to.eventually.equal("Yo, I'm the first element of the response");
        expect(spy).to.have.been.calledWith("test_res", "testProc", "testarg1", "testarg2");
    });
});
