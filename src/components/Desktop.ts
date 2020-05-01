import {Component, Vue} from 'vue-property-decorator';
import {
    openUrl,
    open,
    messageBox,
    MessageBoxType,
    clipboard,
    setClipboard,
    expandEnvVars,
    openFile,
    OpenFolderFlags,
    deviceScreenResolution,
    windowSize,
    windowClientSize,
    windowClientRect,
    primaryMonitorInfo,
    windowSendToForeground,
    windowCenterToScreen,
    windowSetFullScreen,
    windowSetFocus,
    windowShowScrollBar,
    windowSetPosition,
    windowSetSize,
    windowRedrawFrame,
    windowIsVisible,
    windowIsEnabled,
    windowShow,
    windowHide,
    windowText,
    windowSetText,
    windowSetState,
    evaluateCodeAsync,
} from '@servicestack/desktop';
import {exec, log } from "../shared";

@Component({ template: 
    `<div id="desktop" class="p-5">
        <div class="row">
            <div class="col col-6">
                <h3 class="mb-4">Desktop General APIs</h3>

                <p>
                    <pre>open('%USERPROFILE%\\.sharp-apps')</pre>
                    <button class="btn btn-outline-primary" @click="exec('open')">open</button>
                    <span class="result">{{results.open}}</span>
                </p>

                <p>
                    <pre>openUrl('https://google.com')</pre>
                    <button class="btn btn-outline-primary" @click="exec('openUrl')">openUrl</button>
                    <span class="result">{{results.openUrl}}</span>
                </p>

                <p>
                    <pre>messageBox('The Title', 'Caption', MessageBoxType.YesNo | MessageBoxType.IconInformation)</pre>
                    <button class="btn btn-outline-primary" @click="exec('messageBox')">messageBox</button>
                    <span class="result">{{results.messageBox}}</span>
                </p>
                
                <p>
                    <button class="btn btn-outline-primary" @click="exec('clipboard')">clipboard</button>
                    <span class="result">{{results.clipboard}}</span>
                </p>
                
                <p>
                    <pre>setClipboard(\`Counter: \${counter++}\`)</pre>
                    <button class="btn btn-outline-primary" @click="exec('setClipboard')">setClipboard</button>
                    <span class="result">{{results.setClipboard}}</span>
                </p>
                
                <p>
                    <pre>expandEnvVars('%USERPROFILE% %windir% %OS%')</pre>
                    <button class="btn btn-outline-primary" @click="exec('expandEnvVars')">expandEnvVars</button>
                    <span class="result">{{results.expandEnvVars}}</span>
                </p>
                
                <p>
<pre>openFile({
  title: 'Pick Images',
  filter: "Image files (*.png;*.jpeg)|*.png;*.jpeg|All files (*.*)|*.*",
  initialDir: await expandEnvVars('%USERPROFILE%\\Pictures'),
  defaultExt: '*.png',
})</pre>
                    <button class="btn btn-outline-primary" @click="exec('openFile')">openFile</button>
                    <span class="result">{{results.openFile}}</span>
                </p>
                
                <p>
                    <pre>openFile({ isFolderPicker: true })</pre>
                    <button class="btn btn-outline-primary" @click="exec('openFolder')">openFile folder</button>
                    <span class="result">{{results.openFolder}}</span>
                </p>
                
                <p v-for="fn in leftScripts">
                    <pre>{{fnBody(fn)}}</pre>
                    <button class="btn btn-outline-primary" @click="exec(fn)">{{fn}}</button>
                    <span>{{results[fn]}}</span>            
                </p>
            </div>
            
            <div class="col col-6">
                <h3 class="mb-4">Window APIs</h3>
                
                <div>
                    X <input type="number" v-model="x" placeholder="X">
                    Y <input type="number" v-model="y" placeholder="Y">
                    W <input type="number" v-model="width" placeholder="Width">
                    H <input type="number" v-model="height" placeholder="Height">
                </div>
                
                
                <div>{{x}}, {{y}}, {{width}}, {{height}}</div>
                
                <p v-for="fn in rightScripts">
                    <pre>{{fnBody(fn)}}</pre>
                    <button class="btn btn-outline-primary" @click="exec(fn)">{{fn}}</button>
                    <span>{{results[fn]}}</span>            
                </p>
                
            </div>
        </div>
        
        <error-summary :responseStatus="responseStatus" />
    </div>`
})
export class Desktop extends Vue {
    
    counter = 1;
    toggleScrollbar = false;
    
    x = 100;
    y = 100;
    width = 800;
    height = 600;

    responseStatus:any = null;
    loading = false;
    
    cmds:{[id:string]:() => Promise<any>} = {
        open: () => open('%USERPROFILE%\\\\.sharp-apps'),
        openUrl: () => openUrl('https://google.com'),
        messageBox: () => messageBox('The Title', 'Caption', MessageBoxType.YesNo | MessageBoxType.IconInformation),
        clipboard: () => clipboard(),
        setClipboard: async () => await setClipboard(`Counter: ${this.counter++}`),
        expandEnvVars: () => expandEnvVars('%USERPROFILE% %windir% %OS%'),
        openFile: async () => await openFile(  {
            title: 'Pick Images',
            filter: "Image files (*.png;*.jpeg)|*.png;*.jpeg|All files (*.*)|*.*",
            initialDir: await expandEnvVars('%USERPROFILE%\\\\Pictures'),
            defaultExt: '*.png',
        }),
        openFolder: () => openFile({ isFolderPicker: true }),
        deviceScreenResolution,
        primaryMonitorInfo,
        windowSize,
        windowClientSize,
        windowClientRect,
        windowSendToForeground,
        windowCenterToScreen,
        windowSetPosition: this.windowSetPosition,
        windowSetSize: this.windowSetSize,
        windowSetFullScreen,
        windowSetFocus,
        windowShowScrollBar: () => windowShowScrollBar(this.toggleScrollbar=!this.toggleScrollbar),
        windowRedrawFrame,
        windowIsVisible,
        windowIsEnabled,
        windowText,
        windowSetText: () => windowSetText(`Counter: ${this.counter++}`),
        windowHide,
        windowShow,
    }
    results:{[id:string]:string} = {};

    async windowSetPosition() {
        return await windowSetPosition(this.x, this.y);
    }
    async windowSetSize() {
        return await windowSetSize(this.width, this.height);
    }
    
    leftScripts = ['deviceScreenResolution','primaryMonitorInfo','windowSize','windowClientSize','windowClientRect'];
    
    get rightScripts() { return Object.keys(this.cmds).filter(x => x.startsWith('window') && this.leftScripts.indexOf(x) == -1); }
    
    fnBody(cmd:string) {
        if (cmd == 'windowSetPosition') return `windowSetPosition(x, y)`;
        if (cmd == 'windowSetSize') return `windowSetSize(width, height)`;
        if (cmd == 'windowShowScrollBar') return `windowShowScrollBar(toggleScrollbar=!toggleScrollbar)`;
        if (cmd == 'windowSetText') return "windowSetText(`Counter: ${this.counter++}`)";
        return cmd.toString() + "()";
    }
    
    async exec(cmd:string) {
        await exec(this, async () => {
            const fn = this.cmds[cmd];
            if (!fn)
                throw `'${cmd}' does not exist`;
            const ret = await fn();
            this.$set(this.results, cmd, ret);
        });
    }
}
export default Desktop;
