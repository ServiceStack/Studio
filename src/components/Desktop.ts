import {Component, Vue} from 'vue-property-decorator';
import {
    messageBox,
    MessageBoxType,
    clipboard,
    setClipboard,
    expandEnvVars,
    openFile,
    OpenFolderFlags,
} from '@servicestack/desktop';
import {exec, log} from "../shared";

@Component({ template: 
    `<div id="desktop" class="p-5">
        <h3>Desktop API Test Page</h3>
        
        <p>
            <pre>messageBox('The Title', 'Caption', MessageBoxType.YesNo | MessageBoxType.IconInformation)</pre>
            <button @click="doMessageBox()">messageBox</button>
            <div>Result: <span>{{messageBoxResult}}</span></div>            
        </p>
        
        <p>
            <button @click="doClipboard()">clipboard</button>
            <div>Result: <span>{{currentClip}}</span></div>            
        </p>
        
        <p>
            <pre>setClipboard(\`Counter: \${counter++}\`)</pre>
            <button @click="doSetClipboard()">setClipboard</button>
        </p>
        
        <p>
            <pre>expandEnvVars('%USERPROFILE% %windir% %OS%')</pre>
            <button @click="doExpandEnvVars()">expandEnvVars</button>
            <div>Result: <span>{{expandVarsResult}}</span></div>            
        </p>
        
        <p>
<pre>openFile({
  title: 'Pick Images',
  filter: "Image files (*.png;*.jpeg)|*.png;*.jpeg|All files (*.*)|*.*",
  initialDir: await expandEnvVars('%USERPROFILE%\\Pictures'),
  defaultExt: '*.png',
})</pre>
            <button @click="doOpenFile()">openFile</button>
            <div>Result: <span>{{openFileResult}}</span></div>            
        </p>
        
        <p>
<pre>openFile({ isFolderPicker: true })</pre>
            <button @click="doOpenFolder()">openFile folder</button>
            <div>Result: <span>{{openFolderResult}}</span></div>            
        </p>
        
        <error-summary :responseStatus="responseStatus" />
    </div>`
})
export class Desktop extends Vue {
    counter = 0;
    messageBoxResult:number|null = null;
    currentClip = '';
    expandVarsResult = '';
    openFileResult = '';
    openFolderResult = '';

    responseStatus:any = null;
    loading = false;
    
    async doMessageBox() {
        await exec(this, async () => {
            this.messageBoxResult = await messageBox('The Title', 'Caption', MessageBoxType.YesNo | MessageBoxType.IconInformation)
        });
    }

    async doClipboard() {
        await exec(this, async () => {
            this.currentClip = await clipboard();
        });
    }

    async doSetClipboard() {
        await exec(this, async () => {
            await setClipboard(`Counter: ${this.counter++}`)
            this.currentClip = await clipboard();
        });
    }

    async doExpandEnvVars() {
        await exec(this, async () => {
            this.expandVarsResult =  await expandEnvVars('%USERPROFILE% %windir% %OS%');
        });
    }

    async doOpenFile() {
        await exec(this, async () => {
            const initialDir = await expandEnvVars('%USERPROFILE%\\My Pictures');
            log('openFile', initialDir);
            const ret = await openFile(  {
                title: 'Pick Images',
                filter: "Image files (*.png;*.jpeg)|*.png;*.jpeg|All files (*.*)|*.*",
                initialDir,
                defaultExt: '*.png',
            });
            this.openFileResult = JSON.stringify(ret);
        });
    }

    async doOpenFolder() {
        await exec(this, async () => {
            const ret = await openFile({ isFolderPicker: true });
            this.openFolderResult = JSON.stringify(ret);
        });
    }

}
export default Desktop;
