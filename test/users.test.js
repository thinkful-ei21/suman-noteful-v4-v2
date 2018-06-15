'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return User.createIndexes();
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });
  
  describe('/api/users', function () {
    describe('POST', function () {
      it('Should create a new user', function () {
        const testUser = { username, password, fullname };

        let res;
        return chai
          .request(app)
          .post('/api/users')
          .send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');

            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.fullname).to.equal(testUser.fullname);

            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user.id).to.equal(res.body.id);
            expect(user.fullname).to.equal(testUser.fullname);
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });


      it('Should reject users with missing username', function () {
        const testUser = { password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('status','message');
            expect(res.body.message).to.be.a('string');
            // eslint-disable-next-line
            expect(res.body.message).to.be.equal("Missing 'username' in request body");
          });
      });

      it('Should reject users with missing password',function(){
        const testUser = { username, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('status','message');
            expect(res.body.message).to.be.a('string');
            // eslint-disable-next-line
            expect(res.body.message).to.be.equal("Missing 'password' in request body");
          });
      });

      it('Should reject users with non-string username',function(){
        const testUser = {fullname,username: true, password};
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('status','message');
            expect(res.body.message).to.be.a('string');
            // eslint-disable-next-line
          expect(res.body.message).to.be.equal("Field: 'username' must be type String");
          });
      });


      it('Should reject users with non-string password',function(){
        const testUser = {fullname,username, password: true};
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('status','message');
            expect(res.body.message).to.be.a('string');
            // eslint-disable-next-line
          expect(res.body.message).to.be.equal("Field: 'password' must be type String");
          });
      });

      it('Should reject users with non-trimmed username',function(){
        const testUser = {fullname,username: '  nancyuser  ', password};
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('status','message');
            expect(res.body.message).to.be.a('string');
            // eslint-disable-next-line
            expect(res.body.message).to.be.equal("Field: 'username' cannot start or end with whitespace");
          });
      });


      it('Should reject users with non-trimmed password',function(){
        const testUser = {fullname,username, password: '  password  '};
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('status','message');
            expect(res.body.message).to.be.a('string');
            // eslint-disable-next-line
            expect(res.body.message).to.be.equal("Field: 'password' cannot start or end with whitespace");
          });
      });


      it('Should reject users with empty username',function(){
        const testUser = {fullname,username: '', password};
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('status','message');
            expect(res.body.message).to.be.a('string');
            // eslint-disable-next-line
            expect(res.body.message).to.be.equal("Field: 'username' must be at least 1 characters long");
          });
      });

      it('Should reject users with password less than 8 characters',function(){
        const testUser = {fullname,username, password:'passwor'};
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('status','message');
            expect(res.body.message).to.be.a('string');
            // eslint-disable-next-line
            expect(res.body.message).to.be.equal("Field: 'password' must be at least 8 characters long");
          });
      });


      it('Should reject users with password greater than 72 characters',function(){
        const lorem = 'Posuere sollicitudin aliquam ultrices sagittis orci a. Feugiat sed lectus vestibulum mattis ullamcorper velit. Odio pellentesque diam volutpat commodo sed egestas egestas fringilla. Velit egestas dui id ornare arcu odio. Molestie at elementum eu facilisis sed odio morbi. Tempor nec feugiat nisl pretium. At tempor commodo ullamcorper a lacus. Egestas dui id ornare arcu odio. Id cursus metus aliquam eleifend. Vitae sapien pellentesque habitant morbi tristique. Dis parturient montes nascetur ridiculus. Egestas egestas fringilla phasellus faucibus scelerisque eleifend. Aliquam faucibus purus in massa tempor nec feugiat nisl.';
        const testUser = {fullname,username, password: lorem};
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('status','message');
            expect(res.body.message).to.be.a('string');
            // eslint-disable-next-line
            expect(res.body.message).to.be.equal("Field: 'password' must be at most 72 characters long");
          });
      });

      it('Should reject users with duplicate username',function(){        
        const testUser = {fullname,username: 'bobuser', password};        
        return User.create(testUser)
          .then(() => {
            return chai.request(app).post('/api/users').send(testUser)
              .then(res => {            
                expect(res).to.have.status(400);
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.keys('status','message');
                expect(res.body.message).to.be.a('string');
                // eslint-disable-next-line
                expect(res.body.message).to.be.equal("The username already exists");
              });
          });        
      });

      it('Should trim fullname',function(){
        const testUser = {fullname: '  testuser  ',username, password};
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');
            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.fullname).to.equal(testUser.fullname.trim());
          });
      });

    // describe('GET', function () {
    //   it('Should return an empty array initially', function () {
    //     return chai.request(app).get('/api/users')
    //       .then(res => {
    //         expect(res).to.have.status(200);
    //         expect(res.body).to.be.an('array');
    //         expect(res.body).to.have.length(0);
    //       });
    //   });
    //   it('Should return an array of users', function () {
    //     const testUser0 = {
    //       username: `${username}`,
    //       password: `${password}`,
    //       fullname: ` ${fullname} `
    //     };
    //     const testUser1 = {
    //       username: `${username}1`,
    //       password: `${password}1`,
    //       fullname: `${fullname}1`
    //     };
    //     const testUser2 = {
    //       username: `${username}2`,
    //       password: `${password}2`,
    //       fullname: `${fullname}2`
    //     };

    //     /**
    //      * CREATE THE REQUEST AND MAKE ASSERTIONS
    //      */
    //   });
    });
  });
});