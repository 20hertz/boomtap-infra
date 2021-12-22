#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BootstrapStack } from '../lib/bootstrap-stack';

const app = new cdk.App();
new BootstrapStack(app, 'BootstrapStack');
