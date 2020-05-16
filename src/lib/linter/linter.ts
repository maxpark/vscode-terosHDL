// import { Disposable, workspace, TextDocument, window, QuickPickItem, ProgressLocation} from "vscode";
import * as jsteros from 'jsteros';
import * as vscode from 'vscode';

export default class lint_manager {
	// private diagnostic_collection: vscode.DiagnosticCollection;
    private subscriptions: Disposable[];
    private linter;
    private linter_name: string;
    private linter_enable;
    private lang : string;
    protected diagnostic_collection: vscode.DiagnosticCollection;
    
    constructor(language: string) {
        this.lang = language;
		this.diagnostic_collection = vscode.languages.createDiagnosticCollection();
        vscode.workspace.onDidOpenTextDocument(this.lint, this, this.subscriptions);
        vscode.workspace.onDidSaveTextDocument(this.lint, this, this.subscriptions);
        vscode.workspace.onDidCloseTextDocument(this.remove_file_diagnostics, this, this.subscriptions)

        vscode.workspace.onDidChangeConfiguration(this.config_linter, this, this.subscriptions);
        this.config_linter();
    }

    config_linter(doc: vscode.TextDocument) {
        //todo: use doc!! .git error
        let linter_name;
        linter_name = vscode.workspace.getConfiguration("teroshdl.linter." + this.lang).get<string>("linter");
        linter_name = linter_name.toLowerCase();
        this.linter_name = linter_name;

        this.linter_enable = vscode.workspace.getConfiguration("teroshdl.linter." + this.lang).get<boolean>("enable");
        if (this.linter_enable == true) {
            console.log("Using linter " + linter_name);
            this.linter = new jsteros.Linter.LinterFactory(linter_name, null);
        }
        else{
            this.linter = null;
            return;
        }
    }

	public remove_file_diagnostics(doc: TextDocument) {
        let pepe = doc.uri;
		this.diagnostic_collection.delete(doc.uri);
	}

    async lint(doc: vscode.TextDocument) {
        //todo: use doc!! .git error check sheme
        if (vscode.window.activeTextEditor == null){
            return;
        }
        let document = vscode.window.activeTextEditor.document;
        let language_id : string = document.languageId;
        if(this.linter == null || (language_id != this.lang)){
            return;
        }
        // let docUri: string = doc.uri.fsPath;
        let current_path = vscode.window.activeTextEditor?.document.uri.fsPath;

        let errors  = await this.linter.lint(current_path,"");
        let diagnostics: vscode.Diagnostic[] = [];
        for (var i=0; i<errors.length;++i){
            const line = errors[i]['location']['position'][0];
            const col  = errors[i]['location']['position'][1];
            const range = [[(+line) - 1, (+col) - 1], [(+line) - 1, 1000]];
            diagnostics.push({
                severity: vscode.DiagnosticSeverity.Error,
                range:new vscode.Range((+line) - 1, (+col) - 1, (+line) - 1, Number.MAX_VALUE),
                message: errors[i]['description'],
                code: this.linter_name,
                    source: 'terosHDL'
                });
        }
        let juan = document.uri;
        this.diagnostic_collection.set(document.uri, diagnostics);
    }

    get_bug_path(doc: vscode.TextDocument){

    }
}