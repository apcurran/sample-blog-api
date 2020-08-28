const { expect } = require("chai");
const jwt = require("jsonwebtoken");
const sinon = require("sinon");

const authMiddleware = require("../middleware/is-auth");

describe("Auth middleware", function() {
    it("Should throw an error if no authorization header is present", function() {
        const req = {
            get() {
                return null;
            }
        };
    
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw("Not authenticated."); // dummy empty object for res and empty func for next
    });
    
    it("Should throw an error if the auth header is only one string without a space", function() {
        const req = {
            get() {
                return "xyz";
            }
        };
    
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
    });

    it("Should throw an error if the token cannot be verified", function() {
        const req = {
            get() {
                return "Bearer xyz";
            }
        };

        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
    });

    it("Should yield a userId after decoding the token", function() {
        const req = {
            get() {
                return "Bearer xlajsdkfd";
            }
        };

        // Mock verify function
        sinon.stub(jwt, "verify");
        jwt.verify.returns({ userId: "abc" });

        authMiddleware(req, {}, () => {});
        expect(req).to.have.property("userId");
        expect(req).to.have.property("userId", "abc");
        expect(jwt.verify.called).to.be.true;

        // Restore original jwt verify function
        jwt.verify.restore();
    });
});
