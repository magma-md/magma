import fs from 'fs';
import electron from 'electron';

class IoUtility {
    promptOpen(options: Electron.OpenDialogOptions): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const focusedWindow = electron.BrowserWindow.getFocusedWindow();
            const window = focusedWindow || electron.BrowserWindow.getAllWindows()[0];

            if(!window) {
                reject(new Error('No window available'));
                return;
            }

            electron.dialog.showOpenDialog(window, options)
                .then(result => {
                    if(result.canceled) {
                        reject();
                    } else {
                        resolve(result.filePaths);
                    }
                })
                .catch(reject);
        });
    }

    async promptSave(options: Electron.SaveDialogOptions): Promise<string> {
        const result = await electron.dialog.showSaveDialog(options);
        if(result.canceled || !result.filePath) {
            return Promise.reject();
        } else {
            return result.filePath;
        }
    }

    readFile(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(path, 'utf8', (err, data) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    writeFile(path: string, data: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, data, 'utf8', (err) => {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            })
        })
    }
}

export default new IoUtility();