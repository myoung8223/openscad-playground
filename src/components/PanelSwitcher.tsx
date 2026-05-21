// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import React, { useContext, useRef } from 'react';
import { SingleLayoutComponentId } from '../state/app-state.ts'
import { TabMenu } from 'primereact/tabmenu';
import { ToggleButton } from 'primereact/togglebutton';
import { Button } from 'primereact/button';
import { ModelContext } from './contexts.ts';

export default function PanelSwitcher() {
  const model = useContext(ModelContext);
  if (!model) throw new Error('No model');

  const state = model.state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const singleTargets: {id: SingleLayoutComponentId, icon: string, label: string}[] = [
    { id: 'editor', icon: 'pi pi-pencil', label: 'Edit' },
    { id: 'viewer', icon: 'pi pi-box', label: 'View' },
  ];
  if ((state.parameterSet?.parameters?.length ?? 0) > 0) {
    singleTargets.push({ id: 'customizer', icon: 'pi pi-sliders-h', label: 'Customize' });
  }
  const multiTargets = singleTargets;

  // --- NATIVE EXTRACTION ---
  const saveScadFile = () => {
    let currentCode = "";

    // 1. Intercept Monaco Editor directly from the global window pool
    try {
      const monaco = (window as any).monaco;
      if (monaco && monaco.editor) {
        const models = monaco.editor.getModels();
        if (models && models.length > 0) {
          // Grab the active SCAD document buffer
          const targetModel = models.find((m: any) => m.uri && m.uri.path.includes('.scad')) || models[0];
          currentCode = targetModel.getValue();
        }
      }
    } catch (e) {
      console.warn("Monaco global pool inaccessible:", e);
    }

    // 2. Fallback: Search the state files dictionary
    if (!currentCode && state) {
      const filesObj = (state as any).files || (state as any).documents;
      if (filesObj) {
        const activePath = (state as any).params?.activePath || '/playground.scad';
        currentCode = filesObj[activePath] || filesObj['playground.scad'] || Object.values(filesObj)[0] || "";
      }
    }

    // 3. Fallback: Try common getter names dynamically
    if (!currentCode && model) {
      if (typeof (model as any).getCode === 'function') currentCode = (model as any).getCode();
      else if (typeof (model as any).getText === 'function') currentCode = (model as any).getText();
      else if (typeof (model as any).getFile === 'function') currentCode = (model as any).getFile('/playground.scad');
    }

    if (!currentCode) {
      // 🚨 THE DIAGNOSTIC BOMB 🚨
      // Extracts all available functions on the model's prototype to find the hidden getter
      const proto = Object.getPrototypeOf(model);
      const methods = Object.getOwnPropertyNames(proto).filter(prop => typeof (model as any)[prop] === 'function');
      
      alert(`Debug Data - Monaco Not Exposed.\n\nAvailable Model Methods:\n${methods.join(', ')}\n\nPlease paste this list into the chat!`);
      return;
    }

    // Download Success!
    const blob = new Blob([currentCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "model.scad";
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- NATIVE INJECTION ---
  const openScadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result;
      if (typeof fileContent === "string") {
        let injected = false;
        
        // 1. Force feed Monaco natively
        try {
          const monaco = (window as any).monaco;
          if (monaco && monaco.editor) {
            const models = monaco.editor.getModels();
            if (models && models.length > 0) {
              const targetModel = models.find((m: any) => m.uri && m.uri.path.includes('.scad')) || models[0];
              targetModel.setValue(fileContent);
              injected = true;
            }
          }
        } catch (e) {}

        // 2. Force feed the state dictionary
        if (!injected && state) {
          const filesObj = (state as any).files;
          if (filesObj) {
            const activePath = (state as any).params?.activePath || '/playground.scad';
            filesObj[activePath] = fileContent;
            injected = true;
          }
        }

        // 3. Dynamic method calls
        if (!injected) {
          if (typeof (model as any).setCode === 'function') (model as any).setCode(fileContent);
          else if (typeof (model as any).setFile === 'function') (model as any).setFile('/playground.scad', fileContent);
        }

        // Kickstart the compiler engine
        if (typeof model.render === 'function') {
          model.render({ isPreview: true, now: true });
        }
      }
      if (event.target) event.target.value = '';
    };
    reader.readAsText(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="">
      <div className='flex flex-row' style={{
        margin: '5px',
        position: 'relative',
        alignItems: 'center',
      }}>

        {state.view.layout.mode === 'multi'
          ?   <div className='flex flex-row gap-1' style={{
            justifyContent: 'center',
            flex: 1,
            margin: '5px'
          }}>
                {multiTargets.map(({icon, label, id}) => 
                  <ToggleButton
                    key={id}
                    checked={(state.view.layout as any)[id]}
                    onLabel={label}
                    offLabel={label}
                    onIcon={icon}
                    offIcon={icon}
                    onChange={e => model.changeMultiVisibility(id, e.value)}
                    />
                  )}
              </div>
          :   <>
                <TabMenu
                  activeIndex={singleTargets.map(t => t.id).indexOf(state.view.layout.focus)}
                  style={{
                    flex: 1,
                  }}
                  model={singleTargets.map(({icon, label, id}) => 
                  ({icon, label, command: () => model.changeSingleVisibility(id)}))} />
              </>
        }

        {/* --- File Action Buttons --- */}
        <div className="flex flex-row gap-2" style={{ marginLeft: '10px', paddingRight: '5px' }}>
          <Button 
            label="Open .scad" 
            icon="pi pi-upload" 
            onClick={triggerFileSelect} 
            className="p-button-info"
            style={{ whiteSpace: 'nowrap' }}
          />

          <Button 
            label="Save .scad" 
            icon="pi pi-download" 
            onClick={saveScadFile} 
            className="p-button-success"
            style={{ whiteSpace: 'nowrap' }}
          />
        </div>

      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        accept=".scad" 
        onChange={openScadFile} 
        style={{ display: 'none' }} 
      />
    </div>
  );
}