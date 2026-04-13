- [X] findAll
  - [X] pagination parameter so that it returns only certain records set by the limits and starts form the offset specified(default limit = 5, offset = 0)
  - [X] find all by the condition(condition is optional parameter)

- [X] findOne
  - [X] update the where clause to generate the query condition based on the dynamic objects properties

- [X] deleteById
  - [X] Update to return a promise of type boolean indicating the success or the failure of the delete operation

- [X] deleteAll
  - [X] delete all by the condition(condition is optional parameter)
  - [X] include a limit param to limit the number of records to delete
  - [X] Return a promise of number type to indicate the number of records deleted

- [X] deleteOne
  - [X] update the where clause to generate the query condition based on the dynamic objects properties
  - [X] Update to return a promise of type boolean indicating the success or the failure of the delete operation

<!-- - [ ] updateById
  - [ ] update the record of the table which takes the columns and its value to be updated and returns if successfully updated the columns or not by returning the true/false 

- [ ] updateAll
  - [ ] update all the records of the table
  - [ ] can pass optional condition parameter and where clause and limit the records to be updated

- [ ] updateOne
  - [ ] update one record based on the condition -->

- [X] update
  - [X] a single update query generator that takes the target columns(the fields to be updated and its new value) 
  - [X] optional condition params to update only fields that matches the condition 
  - [X] optional limit parameter to limit the number of rows to be updated