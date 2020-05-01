{{ 
    var AppSvgs = {
        'hardware/security.svg':              'auth',
        'toggle/check_box.svg':               'check_box_on',
        'toggle/check_box_outline_blank.svg': 'check_box_off',
        'navigation/expand_more.svg':         'chevron-down',
        'navigation/chevron_left.svg':        'chevron-left',
        'navigation/chevron_right.svg':       'chevron-right',
        'navigation/expand_less.svg':         'chevron-up',
        'navigation/close.svg':               'close',
        'hardware/cast.svg':                  'connect',
        'content/create.svg':                 'create',
        'content/add_circle.svg':             'create_circle',
        'action/find_in_page.svg':            'db',
        'action/delete.svg':                  'delete',
        'action/dns.svg':                     'dns',
        'action/done.svg':                    'done',
        'action/help_outline.svg':            'help',
        'action/history.svg':                 'history',
        'navigation/double_arrow.svg':        'play',
        'content/remove.svg':                 'remove',
        'content/remove_circle.svg':          'remove_circle',
        'content/save_alt.svg':               'save',
        'image/edit.svg':                     'update',
        'action/home.svg':                    'home',
        'content/block.svg':                  'block',
        'action/bug_report.svg':              'debug',
    } 
}}

```code
#each AppSvgs
    `/lib/svg/material/${it.Key}` |> svgAddFile(it.Value,'app')
/each
```

{{#svg lock app}}
<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
    <g fill="none">
        <path d="M0 0h24v24H0V0z"/>
        <path d="M0 0h24v24H0V0z" opacity=".87"/>
    </g>
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="#ffffff"/>
</svg>
{{/svg}}

{{#svg external-link app}}
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
</svg>
{{/svg}}

{{#svg loading app}}
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     x="0px" y="0px" width="24px" height="30px" viewBox="0 0 24 30" style="enable-background:new 0 0 50 50" xml:space="preserve">
    <rect x="0" y="10" width="4" height="10" fill="#333" opacity="0.2">
        <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0s" dur="0.6s" repeatCount="indefinite" />
        <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0s" dur="0.6s" repeatCount="indefinite" />
        <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0s" dur="0.6s" repeatCount="indefinite" />
    </rect>
    <rect x="8" y="10" width="4" height="10" fill="#333" opacity="0.2">
        <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0.15s" dur="0.6s" repeatCount="indefinite" />
        <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0.15s" dur="0.6s" repeatCount="indefinite" />
        <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0.15s" dur="0.6s" repeatCount="indefinite" />
    </rect>
    <rect x="16" y="10" width="4" height="10" fill="#333" opacity="0.2">
        <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0.3s" dur="0.6s" repeatCount="indefinite" />
        <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0.3s" dur="0.6s" repeatCount="indefinite" />
        <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0.3s" dur="0.6s" repeatCount="indefinite" />
    </rect>
</svg>
{{/svg}}

{{#svg logo app}}
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff" width="48px" height="48px">
    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
    <path d="M0 0h24v24H0z" fill="none"/>
</svg>
{{/svg}}

{{htmlError}}
