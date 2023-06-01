const { expect } = require("chai");
const authMiddleware = require("../middleware/is-auth");

describe("authMiddleware", function () {
  it("should throw an error if authorization header is only one string", function () {
    const req = {
      get: function (headerName) {
        return "String";
      },
    };
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });
});
