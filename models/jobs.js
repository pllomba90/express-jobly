"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");



class Job{

    static async create({title, salary, equity, company_handle}){
        const duplicateCheck = await db.query(
        `SELECT title, company_handle
        FROM jobs
        WHERE title = $1 
        AND company_handle = $2`,
     [title, company_handle]);

 if (duplicateCheck.rows[0])
   throw new BadRequestError(`Duplicate job: ${title}`);

   const result = await db.query(`
   INSERT INTO jobs (title, salary, equity, company_handle)
   VALUES ($1, $2, $3, $4)
   RETURNING title, salary, equity, company_handle`,
   [title,
    salary,
    equity,
    company_handle]);

    const job = result.rows[0];
    return job;
    };

    static async findAll(){
        const results = await db.query(`
        SELECT title,
        salary,
        equity,
        company_handle
        FROM jobs
        ORDER BY company_handle`);
        return results.rows;
    };

    static async get(title){
        const results = await db.query(`
        SELECT title,
        salary,
        equity,
        company_handle
        FROM jobs
        WHERE title = $1
        ORDER BY company_handle`, 
        [title]);

        if (result.rows.length === 0){
            return ({ "message":"No matching jobs. Please adjust your search parameters."});
          }

        return results.rows;
    };

    static async filterJobs(title, minSalary, equity){
        let query = (`
        SELECT title,
        salary,
        equity,
        company_handle
        FROM jobs
        WHERE 1=1
        `);

        let values = [];
        let valuesCounter = 0;

        if (title){
            valuesCounter++;
            query += ` AND LOWER(title LIKE $${valuesCounter}`;
            values.push(`%${title.toLowerCase()}%`);
           };
        if (minSalary){
            valuesCounter++;
            query += ` AND salary >= $${valuesCounter}`;
            values.push(parseInt(minSalary));
        };

        if (equity){
            valuesCounter++;
            query += ` AND equity = $${valuesCounter}`;
            values.push("true");
        }

        try {
            const result = await db.query(query, values);
            if (result.rows.length === 0){
              return ({ "message":"No matching companies. Please adjust your search parameters."});
            }
      
            return result.rows;
      
          } catch (error) {
            console.error('Error executing SQL query:', error);
            throw error;
          }
    }

    static async update(id, data){
        const { setCols, values} = sqlForPartialUpdate( 
        data,
        {
            id: "id",
          title: "title",
          salary: "salary",
          equity: "equity"
        });
        const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
    }

    static async remove(id){
      const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`,
        [id]);
        
        const job = result.rows[0]

        if (!job){
            throw new NotFoundError(`No job: ${id}`);
        }
    }


 }

        
