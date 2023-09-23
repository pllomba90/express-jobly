"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { authenticateJWT } = require("../middleware/auth")

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT c.handle,
          c.name,
          c.description,
          c.num_employees AS "numEmployees",
          c.logo_url AS "logoUrl",
          j.title,
          j.salary,
          j.equity
          FROM companies AS c
          LEFT JOIN jobs AS j ON c.handle = j.company_handle
          WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }
/** This functionality adds in the ability to filter your get request to make it 
 * more of a search. This works by creating a basic sql query and then adding to it 
 * if search parameters are entered. 
 */
  static async filterCompanies(res, name, minEmployees, maxEmployees){
    let query = `SELECT handle,
     name, 
     description, 
     num_employees, 
     logo_url
     FROM companies
     WHERE 1=1`

     let values = [];
     let valuesCounter = 0;

     
     if (name){
      valuesCounter++;
      query += ` AND LOWER(name) LIKE $${valuesCounter}`;
      values.push(`%${name.toLowerCase()}%`);
     };

     if (minEmployees){
      valuesCounter++;
      query += ` AND num_employees >= $${valuesCounter}`;
      values.push(parseInt(minEmployees));
     };

     if (maxEmployees){
      valuesCounter++;
      query +=` AND num_employees <= $${valuesCounter}`;
      values.push(parseInt(maxEmployees));
     };

     if (minEmployees && maxEmployees && parseInt(minEmployees) > parseInt(maxEmployees)) {
      res.status(400).json({ error: 'minEmployees should be less than or equal to maxEmployees' });
      return;
    };
    
    try {
      const result = await db.query(query, values);
      console.log(query, values)
      if (result.rows.length === 0){
        return ({ "message":"No matching companies. Please adjust your search parameters."});
      }

      return result.rows;

    } catch (error) {
      console.error('Error executing SQL query:', error);
      throw error;
    }
    
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
