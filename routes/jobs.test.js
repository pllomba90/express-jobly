"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("get routes", () =>{
    test("gets all jobs", async ()=>{
        const result = await request(app).get("/jobs").set("authorization", `Bearer ${u1Token}`);
        expect(result.body).toEqual({
            jobs:
            [
            {
                title: "job1",
                salary: 100000,
                equity: "true",
                company_handle: "c1"
              },

              {
                title: "job2",
                salary: 75000,
                equity: "false",
                company_handle: "c3"
              },

              {
                title: "job3",
                salary: 85000,
                equity: "true",
                company_handle: "c2"
              }
            ],
        });
    });

    test("get specific job", async () =>{
        const result = await request(app).get("/jobs/1").set("authorization", `Bearer ${u1Token}`);
        expect(result.body).toEqual({
            job:
            {
                title: "job1",
                salary: 100000,
                equity: "true",
                company_handle: "c1"
              }
        });
    });

    test("get nonexistent job", async ()=> {
        const res = await request(app).get("/jobs/q");
        expect(res.statusCode).toBe(404);
    })
});

describe("testing post routes", () =>{
    const newJob = {
        title: "new",
        salary: 150000,
        equity: "false",
        company_handle: "c1"
    };

    test("create new job", async () =>{
        const res = await request(app).post("/jobs")
        .send(newJob).set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            job: newJob,
        });
    });

    test("bad request missing info", async () =>{
        const res = await request(app).post("/jobs")
        .send({
            salary: 150,
            equity: "false"
        }).set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toBe(400);
    });

    test("sending info without authorization", async () =>{
        const res = request(app).post("/jobs")
        .send(newJob);
        expect(res.statusCode).toEqual(401);
    });
});

describe("testing patch route", () =>{
    test("functional update", async () =>{
        const res = await request(app).patch("/jobs/1")
        .send({
            title: "job1-new"
        }).set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            job:{
                title: "job1-new",
                salary: 100000,
                equity: "true",
                company_handle: "c1"
              },
        });
    });

    test("update without authorization", async () =>{
        const res = await request(app).patch("/jobs/1")
        .send({
            title: "job1-new"
        });
        expect(res.statusCode).toBe(401);
    });

    test("update nonexistent job", async () =>{
        const res = await request(app).patch("/jobs/q")
        .send({
            title: "job1-new"
        }).set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toBe(404);
    });
});

describe("test delete route", () =>{
    test("successful deletion", async () =>{
        const res = await request(app).delete("/jobs/1")
        .set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toBe(200);
    });

    test("unauthorized deletion", async () =>{
        const res = await request(app).delete("/jobs/1");
        expect(res.statusCode).toBe(401);
    });

    test("deletion of nonexistent job", async () =>{
        const res = await request(app).delete("/jobs/q")
        .set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toBe(404);
    });
});