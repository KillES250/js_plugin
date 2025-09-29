(function() {
    'use strict';
    const clientInstance = window.GameClient;
    if (!clientInstance) {
        console.error("未能找到游戏客户端实例 (GameClient)，脚本加载失败！");
        return;
    }

    // --- 新增：防止重复注入的核心代码 ---
    // 我们在 GameClient 实例上附加一个自定义属性作为标记
    if (clientInstance.__helperScriptInjected) {
        console.warn("辅助脚本已注入，将跳过重复的 Hook 初始化。");
    } else {
        // console.log("首次注入，开始初始化 Hook...");

        // --- 仅在首次注入时执行 Hook ---
        const originalOnData = clientInstance.OnData;
        clientInstance.OnData = function(rawData) {
            let data;
            try {
                data = JSON.parse(rawData);
            } catch (e) {
                // console.log('[接收 Raw]', rawData);
                return originalOnData.apply(this, arguments);
            }
            // console.log('[接收]', data);
            return originalOnData.apply(this, arguments);
        };
        console.log("OnData hook 成功！");

        const originalOnMessage = clientInstance.OnMessage;
        clientInstance.OnMessage = function(msg) {
            // console.log('[tip]', msg);
            return originalOnMessage.apply(this, arguments);
        };
        console.log("OnMessage hook 成功！");

        const originalSend = clientInstance.Send;
        clientInstance.Send = function(msgObject) {
            // console.log('[发送]', msgObject);
            if (typeof msgObject === 'string' && msgObject.trim() !== '') {
                const time = new Date().toLocaleTimeString();
                const formattedMessage = '<hic>' + time + '</hic> <hiy>' + msgObject + '</hiy>';
                clientInstance.OnMessage(formattedMessage);
            }
            return originalSend.apply(this, arguments);
        };
        console.log("Send wrap 成功！");

        // 设置标记，表示已经注入成功
        clientInstance.__helperScriptInjected = true;
    }


    // --- 以下的 UI 创建和事件绑定逻辑保持不变 ---
    // 因为它们有自己的防重复机制 (getElementById)

    function findCommandButton() {
        const candidates = document.querySelectorAll('span.act-item[cmd]');
        for (const button of candidates) {
            if (button.textContent.trim() === '命令') {
                return button;
            }
        }
        return null;
    }

    function createCommandInput() {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '在此输入命令后按回车发送...';
        input.id = 'custom-command-input';
        Object.assign(input.style, {
            width: '100%',
            padding: '8px',
            border: 'none',
            borderTop: '1px solid #444',
            borderBottom: '1px solid #444',
            backgroundColor: '#1c1c1c',
            color: '#ddd',
            boxSizing: 'border-box',
            display: 'block'
        });

        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const command = input.value.trim();
                if (command) {
                    const targetButton = findCommandButton();
                    if (targetButton) {
                        targetButton.setAttribute('cmd', command);
                        targetButton.click();
                        // console.log(`通过精确查找(文本为"命令")并模拟点击按钮发送了命令: ${command}`);
                        input.value = '';
                    } else {
                        // const errorMsg = "未能精确找到文本内容为“命令”的按钮！命令发送失败。";
                        console.error(errorMsg);
                        clientInstance.OnMessage(`<hir>错误：</hir> <hiy>${errorMsg}</hiy>`);
                    }
                }
            }
        });
        return input;
    }

    const messageContainer = document.querySelector("body > div.container > div.content-message");
    if (messageContainer) {
        // 这个检查可以防止重复创建输入框
        if (!document.getElementById('custom-command-input')) {
            const commandInput = createCommandInput();
            messageContainer.insertAdjacentElement('afterend', commandInput);
            console.log("命令输入框已成功添加到消息窗口和工具栏之间！");
        } else {
            console.log("命令输入框已存在，无需重复创建。");
        }
    } else {
        console.error("未能找到消息容器 (content-message)，无法添加输入框！");
    }
})();