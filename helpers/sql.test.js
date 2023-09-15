process.env.NODE_ENV === "test"

const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require('../expressError');
const { commonAfterAll } = require("../models/_testCommon")

describe('sqlForPartialUpdate', () => {
  it('should generate SQL for partial update', () => {
    const dataToUpdate = {
      firstName: 'Aliya',
      age: 32,
    };
    const jsToSql = {
      firstName: 'first_name',
    };

    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(setCols).toBe('"first_name"=$1, "age"=$2');
    expect(values).toEqual(['Aliya', 32]);
  });

  it('should throw BadRequestError if no data is provided', () => {
    const dataToUpdate = {};
    const jsToSql = {};

    try {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
    } catch (error) {
      expect(error instanceof BadRequestError).toBe(true);
      expect(error.message).toBe('No data');
    }
  });
});

commonAfterAll(commonAfterAll);
