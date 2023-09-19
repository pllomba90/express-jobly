"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");
const Company = require("./company.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


describe("create", () =>{
    const newJob = {
        title: "Job",
        salary: 1000,
        equity: "true",
        company_handle: "google"
    }
    test("works", async () => {
        const job = await Job.create(newJob);
        expect(job).toEqual(newJob);

        const result = await db.query(`
        SELECT title,
         salary,
        equity, 
        company_handle
        FROM jobs 
        WHERE title = "Job"`);
        expect(result.rows).toEqual([
            {
            title: "Job",
            salary: 1000,
            equity: "true",
            company_handle: "google"
            }
        ]);
    });

    test("duplicate creation", async () =>{
        try{
            await Job.create(newJob);
            await Job.create(newJob);
        }catch(err){
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

describe("get", () =>{
    test("get all, no filter", async () =>{
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                title: "job1",
                salary: 100000,
                equity: "true",
                company_handle: "c1"
            },
            {
                title: "job2",
                salary: 50000,
                equity: "false",
                company_handle: "c3"
            }
        ]);
    });
});

describe("get with filter", ()=>{
    test("working filter", async ()=>{
        const result = await Job.filterJobs("job2");
        expect(result).toEqual(
            {
                title: "job2",
                salary: 50000,
                equity: "false",
                company_handle: "c3"
            });
    });

    test("no results", async ()=>{
        const result = await Job.filterJobs("job3");
        expect(result).toEqual({ "message":"No matching companies. Please adjust your search parameters."});
    });
});

describe("testing update functionality", () =>{
    const newData = {
        salary: 150000,
        equity: "true"
    }
    test("successful update", async () =>{
        const job = await Job.update(2, newData);
        expect(job).toEqual(
            {
                id:2,
                title: "job2",
                ...newData,
                company_handle: "c3"
            });
        const result = await db.query(`
        SELECT title, salary, equity, company_handle
        FROM jobs
        WHERE title = "job2"`);
        expect(result.rows).toEqual([
            {
                title: "job2",
                salary: 150000,
                equity: "true",
                company_handle: "c3"
            }]);
    });

    test("nonexistent job", async () =>{
        try{
            await Job.update(4, newData);
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

describe("Remove functionality", () =>{
    test("successful deletion", async () =>{
        const result = await Job.remove(2);
        expect(result.rows).toEqual(0);
    });

    test("nonexistent job", async () =>{
        try{
            await Job.remove(5);
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});