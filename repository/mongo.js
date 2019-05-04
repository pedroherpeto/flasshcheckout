const constants = require('../constants.json');
const mongoClient = require('mongodb').MongoClient;
const MONGODB_URI = process.env.MONGODB_URI || constants.MONGODB_URI;

mongoConnector = {};

/**
* Insert a new document in mongodb repository
*/
mongoConnector.insertOne = function(collection, doc) {

	return new Promise( (resolve, reject) => {
		mongoClient.connect(MONGODB_URI, (err, db) => {
			if (err) {
				return reject(err);
			}

			db.collection(collection).insertOne(doc, (err, result) => {
				db.close();

				if (err) {
					return reject(err);
				}

				return resolve();
			});

		});
	} );

};

/**
* Update an document based on query and set information
*/
mongoConnector.updateOne = function(collection, query, set) {
	return new Promise( (resolve, reject) => {
		mongoClient.connect(MONGODB_URI, (err, db) => {
			if (err) {
				return reject(err);
			}

			db.collection(collection).updateOne(query, set, (err, results) => {
				db.close();

				if (err) {
					return reject(err);
				}

				return resolve(results);
			});
		});
	});	
};


/**
* Find documents in a collection using query criteria
*/
mongoConnector.findDocuments = function(collection, query, sort) {

	return new Promise( (resolve, reject) => {
		mongoClient.connect(MONGODB_URI, (err, db) => {
			if (err) {
				return reject(err);
			}

			var results = [];
			var cursor = undefined;

			if (sort) {
				cursor = db.collection(collection).find(query).sort(sort);
			} else {
				cursor = db.collection(collection).find(query);
			}

			cursor.each( (err, doc) => {
				if (err) {
					db.close();
					return reject(err);
				}

				if (doc != null) {
					results.push(doc);
				} else {
					db.close();
					return resolve(results);
				}
			});
		});
	});
};

/**
* Find documents in a collection using query criteria
*/

mongoConnector.count = function(collection, query) {
	return new Promise( (resolve, reject) => {
		mongoClient.connect(MONGODB_URI, (err, db) => {
			if (err) {
				return reject(err);
			}

			db.collection(collection).count(query, (err, numOfDocs) => {
				db.close();
				if (err) {
					return reject(err);
				}
				return resolve(numOfDocs);
			} );

		});
	});
}

mongoConnector.getAllDocumentsFromCollection = function(collection) {
	return new Promise( (resolve, reject) => {
		mongoClient.connect(MONGODB_URI, (err, db) => {
			if (err) {
				return reject(err);
			}

			var results = [];

			var cursor = db.collection(collection).find();
			cursor.each( (err, doc) => {
				if (err) {
					db.close();
					return reject(err);
				}

				if (doc != null) {
					results.push(doc);
				} else {
					db.close();
					return resolve(results);
				}
			});
		});
	});
};

module.exports = mongoConnector;