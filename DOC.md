## COMMIT - 1: enhance the column decorator and add default table name if the table name is not specified in the table decorator


 - Enhanced the colum decorator to take an optional parameter that takes the property name as its default values if not given as a paramenter in teh decorator

- Created an helper function getColumnSqlName that returns a object with the database name(the name given in the decorator/fefault property name) and roperty name

- Updated the table decorator to take an optional parameter that generates the database tablename from the class name if not given as a parmater in the decorator

---

- Updated the MySql driver with connect, disconnect method

- Implemented an private helper function that gerneartes the where clause and limit, offsets.


---

- An helper function that maps the db column name to the property name which also only includes the whitelisted(the column that exist in the table) properties.

- Updated the save to get the columMetadata filter and then map

- created getTableName helper for both static and non static methods

---

- Since the id is getting auto generated made sure that its not included when createing the object

- Defined a proper output format for the query result

---

## COMMIT - 2: Postgres

- Implemented the postgress driver