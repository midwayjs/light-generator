import { downloadTemplateFromRepo } from '../util/download';
import { CommonGenerator } from './CommonGenerator';

export class UrlPatternGenerator extends CommonGenerator {

  async run() {
    const serviceName = await downloadTemplateFromRepo(
      this.copyWalker,
      this.templateUri,
      this.templateName,
      this.targetPath
    );
    const message = [
      `Successfully installed "${serviceName}" `,
      `${this.templateName &&
      this.templateName !== serviceName ? `as "${this.templateName}"` : ''}`,
    ].join('');

    console.log(message);
  }

  getTemplatePath(): string {
    return '';
  }

}
