import { CommonGenerator } from './CommonGenerator';
import untildify from 'untildify';

export class LocalPatternGenerator extends CommonGenerator {
  getTemplatePath() {
    return untildify(this.templateUri);
  }
}
