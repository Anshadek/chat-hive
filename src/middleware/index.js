import express from 'express';
import logger from './logger.js';

export default (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(logger);
};
