import { expect } from "chai";
import * as index from "../src/index";

describe("index", () => {
    it("should provide Client", () => {
        expect(index.Client).to.not.be.undefined;
    });
});
