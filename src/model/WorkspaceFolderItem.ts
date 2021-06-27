import * as path from 'path';
import { Uri, window, Disposable } from 'vscode';
import { QuickPickItem } from 'vscode';



class FolderItem implements QuickPickItem {

	label: string;
	description: string;
	
	constructor(public base: Uri, public uri: Uri) {
		this.label = path.basename(uri.fsPath);
		this.description = path.dirname(path.relative(base.fsPath, uri.fsPath));
	}
}