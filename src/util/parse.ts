import * as jc from 'json-cycle';
import * as YAML from 'js-yaml';
// import * as _ from 'lodash';

// const cloudFormationSchema = require('../../plugins/aws/lib/cloudformationSchema');

const loadYaml = (contents, options) => {
  let data;
  let error;
  try {
    data = YAML.load(contents.toString(), options || {});
  } catch (exception) {
    error = exception;
  }
  return { data, error };
};

export function parse(filePath, contents) {
  // Auto-parse JSON
  if (filePath.endsWith('.json')) {
    return jc.parse(contents);
  } else if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) {
    const options = {
      filename: filePath,
    };
    let result = loadYaml(contents.toString(), options);
    if (result.error && result.error.name === 'YAMLException') {
      // _.merge(options, { schema: cloudFormationSchema.schema });
      result = loadYaml(contents.toString(), options);
    }
    if (result.error) {
      throw result.error;
    }
    return result.data;
  }
  return contents.toString().trim();
}
