import untildify from 'untildify';
import { join } from 'path';
import { downloadTemplateFromRepo } from './util/download';
import { dirExistsSync } from './util/dirExistsSync';
import { DirectoryCopyWarker } from './util/copyDirContents';
import { renameService } from './util/renameService';
import { CopyRule, CopyWalker } from './interface';

export class LightGenerator {

  options;
  copyWalker: CopyWalker;

  constructor(options: {
    templatePath: string;
    templateUrl: string;
    templateName: string;
    targetPath: string;
    copyRule: CopyRule[];
  }) {
    this.options = options;
    this.copyWalker = new DirectoryCopyWarker(this.options.copyRule);
  }

  async run(replaceArgs) {
    if ('templateUrl' in this.options) {
      const serviceName = await downloadTemplateFromRepo(
        this.copyWalker,
        this.options[ 'templateUrl' ],
        this.options.templateName,
        this.options.targetPath
      );
      const message = [
        `Successfully installed "${serviceName}" `,
        `${this.options.templateName &&
        this.options.templateName !== serviceName ? `as "${this.options.templateName}"` : ''}`,
      ].join('');

      console.log(message);
    } else if ('templatePath' in this.options) {
      // Copying template from a local directory
      const servicePath = this.options.targetPath
        ? untildify(this.options.targetPath)
        : join(process.cwd(), this.options.templateName);
      if (dirExistsSync(servicePath)) {
        const errorMessage = `A folder named "${servicePath}" already exists.`;
        throw new Error(errorMessage);
      }
      await this.copyWalker.copy(untildify(this.options[ 'templatePath' ]), servicePath, {
        noLinks: true,
      });
      if (this.options.templateName) {
        renameService(this.options.templateName, servicePath);
      }
    }
  }
}
