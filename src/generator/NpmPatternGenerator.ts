import { CommonGenerator } from './CommonGenerator';
import { NpmGeneratorOptions } from '../interface';

export class NpmPatternGenerator extends CommonGenerator {

  npmClient: string;

  constructor(options: NpmGeneratorOptions) {
    super(options);
    this.npmClient = options.npmClient;
  }

  async run() {

  }

  async getParameterList(): Promise<any> {
    return undefined;
  }
}
