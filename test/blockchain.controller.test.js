import "babel-polyfill";

import chai, { expect, should } from "chai";
import chaiHttp from "chai-http";

// import server from "../../app";
const server = "http://localhost:8888";
should();
chai.use(chaiHttp);

describe("Decision", () => {
  it("healtcheck should pass", done => {
    chai
      .request(server)
      .get(`/health-check`)
      .end((err, res) => {
        res.should.have.status(200);
        expect(res.body).to.deep.equal({
          msg: "LBLOD Blockchain event broker up and running!"
        });
        done();
      });
  });

  it("should notify and do nothing", done => {
    chai
      .request(server)
      .post(`/notify`)
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });

  it("should notify random 7 resources", done => {
    chai
      .request(server)
      .post(`/setupByNumber`)
      .send({ amount: 7 })
      .end((err, res) => {
        res.should.have.status(200);
        chai
          .request(server)
          .post(`/notify`)
          .end((err2, res2) => {
            res2.should.have.status(200);
            done();
          });
      });
  });

  it("should validate all resources", done => {
    chai
      .request(server)
      .post(`/validateAll`)
      .end((err, res) => {
        expect(res.body.responses.length).to.above(0);
        res.should.have.status(200);
        done();
      });
  });
});
