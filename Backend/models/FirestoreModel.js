const db = require('../config/firebase');
const bcrypt = require('bcrypt');

function createModel(collectionName) {
    class Model {
        constructor(data = {}) {
            Object.assign(this, data);
        }

        async save() {
            const isNew = !this.id;
            let docRef;
            if (this.id) {
                docRef = db.ref(`${collectionName}/${this.id}`);
            } else {
                docRef = db.ref(collectionName).push();
                this.id = docRef.key;
                this._id = docRef.key;
            }
            
            // Hash password if present
            if (this.password && (isNew || !this.password.startsWith('$2'))) {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
            }

            const timestamp = new Date().toISOString();
            if (isNew) {
                this.createdAt = timestamp;
            }
            this.updatedAt = timestamp;

            const plainData = { ...this };
            delete plainData.id;
            delete plainData._id;
            
            await docRef.set(plainData);
            return this;
        }

        async matchPassword(enteredPassword) {
            return await bcrypt.compare(enteredPassword, this.password);
        }

        toJSON() {
            const copy = { ...this };
            delete copy.password;
            return copy;
        }

        // Static methods
        static async create(data) {
            const instance = new Model(data);
            await instance.save();
            return instance;
        }

        static async findOne(query) {
            const ref = db.ref(collectionName);
            const snapshot = await ref.once('value');
            const data = snapshot.val();
            if (!data) return null;
            for (const [id, item] of Object.entries(data)) {
                let matches = true;
                for (const [qKey, qVal] of Object.entries(query)) {
                    if (item[qKey] !== qVal) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    return new Model({ id, _id: id, ...item });
                }
            }
            return null;
        }

        static async findById(id) {
            if (!id) return null;
            const ref = db.ref(`${collectionName}/${id}`);
            const snapshot = await ref.once('value');
            const data = snapshot.val();
            if (!data) return null;
            return new Model({ id, _id: id, ...data });
        }

        static async findByIdAndUpdate(id, updateData, options = {}) {
            const ref = db.ref(`${collectionName}/${id}`);
            const snapshot = await ref.once('value');
            if (!snapshot.exists()) return null;
            
            const finalUpdate = { ...updateData, updatedAt: new Date().toISOString() };
            if (finalUpdate.password) {
                const salt = await bcrypt.genSalt(10);
                finalUpdate.password = await bcrypt.hash(finalUpdate.password, salt);
            }
            
            await ref.update(finalUpdate);
            const updatedSnapshot = await ref.once('value');
            return new Model({ id, _id: id, ...updatedSnapshot.val() });
        }

        static async findByIdAndDelete(id) {
            const ref = db.ref(`${collectionName}/${id}`);
            const snapshot = await ref.once('value');
            if (!snapshot.exists()) return null;
            const data = snapshot.val();
            await ref.remove();
            return new Model({ id, _id: id, ...data });
        }

        static async countDocuments(query = {}) {
            const ref = db.ref(collectionName);
            const snapshot = await ref.once('value');
            const data = snapshot.val();
            if (!data) return 0;
            
            let count = 0;
            for (const [id, item] of Object.entries(data)) {
                let matches = true;
                for (const [qKey, qVal] of Object.entries(query)) {
                    if (qVal && typeof qVal === 'object' && qVal.$in) {
                        if (!qVal.$in.includes(item[qKey])) {
                            matches = false;
                            break;
                        }
                    } else {
                        if (item[qKey] !== qVal) {
                            matches = false;
                            break;
                        }
                    }
                }
                if (matches) {
                    count++;
                }
            }
            return count;
        }

        static async updateMany(query = {}, updateData = {}) {
            const ref = db.ref(collectionName);
            const snapshot = await ref.once('value');
            const data = snapshot.val();
            if (!data) return { modifiedCount: 0 };
            
            let modifiedCount = 0;
            const updates = {};
            const timestamp = new Date().toISOString();
            for (const [id, item] of Object.entries(data)) {
                let matches = true;
                for (const [qKey, qVal] of Object.entries(query)) {
                    if (item[qKey] !== qVal) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    updates[`${id}`] = { ...item, ...updateData, updatedAt: timestamp };
                    modifiedCount++;
                }
            }
            if (modifiedCount > 0) {
                await ref.update(updates);
            }
            return { modifiedCount };
        }

        static find(query = {}) {
            let ref = db.ref(collectionName);
            
            const executeQuery = async (sortObj, limitVal) => {
                const snapshot = await ref.once('value');
                const data = snapshot.val();
                if (!data) return [];
                
                let results = [];
                for (const [id, item] of Object.entries(data)) {
                    let matches = true;
                    for (const [qKey, qVal] of Object.entries(query)) {
                        if (qVal && typeof qVal === 'object' && qVal.$in) {
                            if (!qVal.$in.includes(item[qKey])) {
                                matches = false;
                                break;
                            }
                        } else {
                            if (item[qKey] !== qVal) {
                                matches = false;
                                break;
                            }
                        }
                    }
                    if (matches) {
                        results.push(new Model({ id, _id: id, ...item }));
                    }
                }
                
                if (sortObj) {
                    results.sort((a, b) => {
                        for (const [sKey, sVal] of Object.entries(sortObj)) {
                            const aVal = a[sKey];
                            const bVal = b[sKey];
                            if (aVal === undefined || bVal === undefined) continue;
                            
                            if (aVal < bVal) return sVal === -1 ? 1 : -1;
                            if (aVal > bVal) return sVal === -1 ? -1 : 1;
                        }
                        return 0;
                    });
                }
                if (limitVal) {
                    results = results.slice(0, limitVal);
                }
                return results;
            };

            const promiseWrapper = {
                _sort: null,
                _limit: null,
                sort: function(sortObj) {
                    this._sort = sortObj;
                    return this;
                },
                limit: function(limitVal) {
                    this._limit = limitVal;
                    return this;
                },
                then: function(onFulfilled, onRejected) {
                    return executeQuery(this._sort, this._limit).then(onFulfilled, onRejected);
                }
            };

            return promiseWrapper;
        }
    }

    return Model;
}

module.exports = createModel;
