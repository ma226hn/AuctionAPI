
import mongoose from 'mongoose'

/**
 * Encapsulates a Mongoose repository base.
 */
export class MongooseRepositoryBase {
  /**
   * The Mongoose model.
   *
   * @type {mongoose.Model}
   */
  #model

  /**
   * The allowed model property names.
   *
   * @type {string[]}
   */
  #allowedModelPropertyNames

  /**
   * Initializes a new instance.
   *
   * @param {mongoose.Model} model - A Mongoose model.
   */
  constructor (model) {
    this.#model = model
  }

  /**
   * Gets the allowed model property names.
   *
   * @returns {string[]} The allowed model property names.
   */
  get allowedModelPropertyNames () {
    // Lazy loading of the property names.
    if (!this.#allowedModelPropertyNames) {
      const disallowedPropertyNames = ['_id', '__v', 'createdAt', 'updatedAt', 'id']
      this.#allowedModelPropertyNames = Object.freeze(
        Object.keys(this.#model.schema.tree)
          .filter(key => !disallowedPropertyNames.includes(key))
      )
    }

    return this.#allowedModelPropertyNames
  }

  /**
   * Gets documents.
   *
   * @param {object} filter - Filter to apply to the query.
   * @param {object|string|string[]} [projection] - Fields to return.
   * @param {object} [options] - See Query.prototype.setOptions().
   * @example
   * // Passing options
   * await myModelRepository.get({ name: /john/i }, null, { skip: 10 }).exec()
   * @returns {Promise<object[]>} Promise resolved with the found documents.
   */
  async get (filter, projection = null, options = null) {
    return this.#model
      .find(filter, projection, options)
      .exec()
  }

  /**
   * Gets a single document by its id.
   *
   * @param {object|number|string} id - Value of the document id to get.
   * @param {object|string|string[]} [projection] - Fields to return.
   * @param {object} [options] - See Query.prototype.setOptions().
   * @returns {Promise<object>} Promise resolved with the found document.
   */
  async getById (id, projection, options) {
    return this.#model
      .findById(id, projection, options)
      .exec()
  }

  /**
   * Gets a single document by the conditions.
   *
   * @param {object} conditions - Value of the document conditions to get.
   * @param {object|string|string[]} [projection] - Fields to return.
   * @param {object} [options] - See Query.prototype.setOptions().
   * @returns {Promise<object>} Promise resolved with the found document.
   */
  async getOne (conditions, projection, options) {
    return this.#model
      .findOne(conditions, projection, options)
      .exec()
  }

  /**
   * Inserts a document into the database.
   *
   * @param {object} insertData -  The data to create a new document out of.
   * @returns {Promise<object>} Promise resolved with the new document.
   */
  async insert (insertData) {
    this.#ensureValidPropertyNames(insertData)

    return this.#model.create(insertData)
  }

  /**
   * Save data.
   *
   * @param {object} insertData  -Data.
   */
  async save (insertData) {
    this.#ensureValidPropertyNames(insertData)
    const user = new this.#model({
      username: insertData.username,
      password: insertData.password,
      firstName: insertData.firstName,
      lastName: insertData.lastName,
      email: insertData.email
    })

    return user.save()
  }

  /**
   * Authenticate.
   *
   * @param {object} userCredential  -Data.
   */
  async authenticate (userCredential) {
    return this.#model.authenticate(userCredential)
  }

  /**
   * Deletes a document.
   *
   * @param {string} id - Value of the documents id to delete.
   * @param {object} [options] - See Query.prototype.setOptions().
   * @returns {Promise<object>} Promise resolved with the removed document.
   */
  async delete (id, options) {
    return this.#model
      .findByIdAndDelete(id, options)
      .exec()
  }

  /**
   * Updates a document according to the new data.
   *
   * @param {string} id - Value of the documents id to update.
   * @param {object} updateData - The new data to update the existing document with.
   * @param {object} [options] - See Query.prototype.setOptions().
   * @throws {Error} If the specified data contains invalid property names.
   * @returns {Promise<object>} Promise resolved with the updated document.
   */
  async update (id, updateData, options) {
    this.#ensureValidPropertyNames(updateData)

    return this.#model
      .findByIdAndUpdate(id, updateData, {
        ...options,
        new: true,
        runValidators: true
      })
      .exec()
  }

  /**
   * Replaces a document according to the new data.
   *
   * @param {string} id - Value of the documents id to replace.
   * @param {object} replaceData - The new data to replace the existing document with.
   * @param {object} [options] - See Query.prototype.setOptions().
   * @throws {Error} If the specified data contains invalid property names.
   * @returns {Promise<object>} Promise resolved with the updated document.
   */
  async replace (id, replaceData, options) {
    this.#ensureValidPropertyNames(replaceData)

    return this.#model
      .findOneAndReplace({ _id: id }, replaceData, {
        ...options,
        returnDocument: 'after',
        runValidators: true
      })
      .exec()
  }

  /**
   * Ensures that the specified data only contains valid property names.
   *
   * @param {object} data - The data to check.
   * @throws {Error} If the specified data contains invalid property names.
   */
  #ensureValidPropertyNames (data) {
    for (const key of Object.keys(data)) {
      if (!this.allowedModelPropertyNames.includes(key)) {
        // Fake it a bit to be able to treat this error as
        // a kind of a Mongoose validation error!
        const error = new Error(`'${key} is not a valid property name.`)
        error.name = 'ValidationError'
        throw error
      }
    }
  }
}
