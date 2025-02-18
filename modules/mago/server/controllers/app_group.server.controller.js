'use strict';

/**
 * Module dependencies.
 */
const path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    winston = require('winston'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    DBModel = db.app_group,
    escape = require(path.resolve('./custom_functions/escape')),
    Joi = require("joi");

/**
 * Create
 */
exports.create = function(req, res) {

  DBModel.create(req.body).then(function(result) {
    if (!result) {
      return res.status(400).send({message: 'fail create data'});
    } else {
      return res.jsonp(result);
    }
  }).catch(function(err) {
    winston.error("Creating an app group failed with error: ", err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Show current
 */
exports.read = function(req, res) {
  res.json(req.appgroups);
};

/**
 * Update
 */
exports.update = function(req, res) {
  var updateData = req.appgroups;

  updateData.update(req.body).then(function(result) {
    res.json(result);
  }).catch(function(err) {
    winston.error("Updating the app group failed with error: ", err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Delete
 */
exports.delete = function(req, res) {
  var deleteData = req.appgroups;

  DBModel.findByPk(deleteData.id).then(function(result) {
    if (result) {

      result.destroy().then(function() {
        return res.json(result);
      }).catch(function(err) {
        winston.error("Deleting the app group failed with error: ", err);
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      });
    } else {
      return res.status(400).send({
        message: 'Unable to find the Data'
      });
    }
  }).catch(function(err) {
    winston.error("Finding the app group failed with error: ", err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });

};

/**
 * List
 */
exports.list = function(req, res) {

  var qwhere = {},
      final_where = {},
      query = req.query;

  //start building where
  final_where.where = qwhere;
  if(parseInt(query._start)) final_where.offset = parseInt(query._start);
  if(parseInt(query._end)) final_where.limit = parseInt(query._end)-parseInt(query._start);
  if(query._orderBy) final_where.order = [[escape.col(query._orderBy), escape.orderDir(query._orderDir)]];
  final_where.include = [];
  //end build final where

  DBModel.findAndCountAll(

     final_where

  ).then(function(results) {
    if (!results) {
      return res.status(404).send({
        message: 'No data found'
      });
    } else {

      res.setHeader("X-Total-Count", results.count);
      res.json(results.rows);
    }
  }).catch(function(err) {
    winston.error("Getting the app group list failed with error: ", err);
    res.jsonp(err);
  });
};

/**
 * middleware
 */
exports.dataByID = function (req, res, next) {
    const getID = Joi.number().integer().required();
    const {error, value} = getID.validate(req.params.appgroupID);

    if (error) {
        return res.status(400).send({
            message: 'Data is invalid'
        });
    }

    DBModel.findOne({
        where: {
            id: value
        }
    }).then(function (result) {
        if (!result) {
            return res.status(404).send({
                message: 'No data with that identifier has been found'
            });
        } else {
      req.appgroups = result;
      next();
      return null;
    }
  }).catch(function(err) {
    winston.error("Finding specific app group failed with error: ", err);
      return res.status(500).send({
          message: 'Error at getting app group data'
      });
  });

};
