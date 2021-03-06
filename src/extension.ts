'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as xml2js from 'xml2js';
import * as vltCom from './vaultCommands';
import * as global from './global';

let jcrPath = '';
let tmpJcrRoot = '';

export function activate(context: vscode.ExtensionContext) {

    let config = vscode.workspace.getConfiguration();
    global.default.localInfo = {
        host: config.get('vsvault.host', 'localhost'),
        port: config.get('vsvault.port', '4502'),
        credentials: config.get('vsvault.credentials', 'admin:admin')
    }
    global.default.vaultPath = config.get('vsvault.vaultLocation', '') + '/vlt';
    global.default.extPath  = context.extensionPath;

    context.subscriptions.push(vscode.commands.registerCommand('extension.vaultPush', (fileUri) => {
        let path = fileUri.path;
        let metaPath = `${global.default.tmpVaultPath}META-INF/vault/`;
        setPathVars(path);

        //Creates import file structure for pushing(importing)
        fs.copySync(path, tmpJcrRoot);
        fs.copySync(`${path.substring(0, path.indexOf('jcr_root'))}META-INF/vault/`, metaPath);

        let filterObject = {
            'workspaceFilter': {
                $: {
                    'vesion': '1.0'
                },
                filter : {
                    $: {
                        'root': jcrPath
                        }
                }
            }
        };

        let builder = new xml2js.Builder();
        let filterXML = builder.buildObject(filterObject);
        fs.outputFile(`${metaPath}filter.xml`, filterXML, vltCom.vaultPush);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.vaultPull', (fileUri) => {
        let path = fileUri.path;
        setPathVars(path);

        vltCom.vaultPull(jcrPath, function(){
            fs.copySync(tmpJcrRoot, path);
            vscode.window.showInformationMessage('Your content has been successfully pulled from the JCR!');
            fs.remove(global.default.tmpVaultPath);
        });

    }));
}

function setPathVars(path: string) {
    if(path.indexOf('jcr_root') <= 1) {
        vscode.window.showInformationMessage('Folder selected needs to be under the jcr_content directory');
        throw new Error('Invalid jcr path!');
    }
    jcrPath = path.substring(path.indexOf('jcr_root')+8);
    tmpJcrRoot = `${global.default.tmpVaultPath}jcr_root${jcrPath}`;
}

export function deactivate() {
}
