/*
 * Copyright 2014 MarkLogic Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var should = require('should');

var fs     = require('fs');
var stream = require('stream');
var util   = require('util');

var concatStream = require('concat-stream');
var valcheck     = require('core-util-is');

var testconfig = require('../etc/test-config.js');
//var testutil   = require('./test-util.js');

var marklogic = require('../');
var q = marklogic.queryBuilder;

var dbWriter = marklogic.createDatabaseClient(testconfig.restWriterConnection);

describe('quick path', function(){
  before(function(done){
   dbWriter.documents.write({
      uri: '/test/query/matchDir/doc1.json',
      collections: '/matchCollection1',
      contentType: 'application/json',
      content: {
        title: 'Vannevar Bush',
        popularity: 5,
        id: '0011',
        date: '2005-01-01',
        price: {
             amt: 0.1
           },
        p: 'Vannevar Bush wrote an article for The Atlantic Monthly'
        }
      },{ 
      uri: '/test/query/matchDir/doc3.json',
      collections: '/matchCollection2',
      contentType: 'application/json',
      content: {
        title: 'For 1945',
        popularity: 3,
        id: '0013',
        date: '2007-03-03',
        price: {
             amt: 1.23
           },
        p: 'For 1945, the thoughts expressed in the Atlantic Monthly were groundbreaking'
        }
      }, { 
      uri: '/test/query/matchDir/doc2.json',
      collections: '/matchCollection1',
      contentType: 'application/json',
      content: {
        title: 'The Bush article',
        popularity: 4,
        id: '0012',
        date: '2006-02-02',
        price: {
             amt: 0.12
           },
        p: 'The Bush article described a device called a Memex'
        }
      }).
    result(function(response){
	console.log(JSON.stringify(response, null, 4));
	done();}, done);
  });
    it('should write objects', function(done){
    dbWriter.writeCollection(
      '/matchCollection1',
      {title: 'quick value 1'},
      {title: 'quick value 2'}
      ).result().
    then(function(uris){
		console.log(JSON.stringify(uris, null, 4));
      valcheck.isUndefined(uris).should.equal(false);
   //   uris.length.should.equal(2);
      return dbWriter.documents.read(uris).result();
      }, done).
    then(function(documents) {
	console.log(JSON.stringify(documents, null, 4));
        valcheck.isUndefined(documents).should.equal(false);
        documents.length.should.equal(2);
        documents[0].should.have.property('content');
        documents[0].content.should.have.property('title');
        documents[1].should.have.property('content');
        documents[1].content.should.have.property('title');
        done();
        }, done);
  }); 
   it('should read objects', function(done){
    dbWriter.read('/test/query/matchDir/doc1.json', '/test/query/matchDir/doc2.json','/test/query/matchDir/doc3.json').
    result(function(objects) {
      valcheck.isUndefined(objects).should.equal(false);
      objects.length.should.equal(3);
      objects[0].should.have.property('title');
      objects[0].title.should.equal('Vannevar Bush');
      objects[1].should.have.property('title');
      objects[1].title.should.equal('The Bush article');
	  objects[2].should.have.property('title');
      objects[2].title.should.equal('For 1945');
      done();
      }, done);
  })
   it('should query objects', function(done){
    dbWriter.queryCollection(
        '/matchCollection1',
        q.where(q.byExample({
          title: 'quick value 1'
        }))).
    result(function(objects) {
	  console.log(JSON.stringify(objects, null, 4));
      valcheck.isUndefined(objects).should.equal(false);
      objects.length.should.equal(1);
      objects[0].should.have.property('title');
      objects[0].title.should.equal('quick value 1');
      done();
      }, done);
  });
  it('should remove a document', function(done) {
    var docUri = '/test/query/matchDir/doc3.json';
    dbWriter.remove(docUri).
    result(function(uri) {
      docUri.should.eql(uri);
      return dbWriter.probe(docUri).result();
      }, done).
    then(function(exists) {
      exists.should.eql(false);
      done();
      }, done);
  });
  it('should probe', function(done){
    dbWriter.probe('/test/query/matchDir/doc3.json').
    result(function(exists) {
      exists.should.eql(false);
      done();
      }, done);
  });
   it('should remove a collection', function(done){
    var collectionUri = '/matchCollection1';
    this.timeout(3000);
    dbWriter.removeCollection(collectionUri).
    result(function(collection) {
      collectionUri.should.eql(collection);
      return dbWriter.probe('/test/query/matchDir/doc1.json').result();
      }, done).
    then(function(exists) {
      exists.should.eql(false);
      done();
      }, done);
  });
  });