import * as jc from 'json-cycle';
import * as YAML from 'js-yaml';

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
    const result = loadYaml(contents.toString(), options);
    if (result.error) {
      throw result.error;
    }
    return result.data;
  }
  return contents.toString().trim();
}
