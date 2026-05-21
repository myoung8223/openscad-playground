// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import React, { useContext } from 'react';
import { SingleLayoutComponentId } from '../state/app-state.ts'
import { TabMenu } from 'primereact/tabmenu';
import { ToggleButton } from 'primereact/togglebutton';
import { Button } from 'primereact/button'; // 🚀 Added PrimeReact Button component
import { ModelContext } from './contexts.ts';

export default function PanelSwitcher() {
  const model = useContext(ModelContext);
  if (!model) throw new Error('No model');

  const state = model.state;

  const singleTargets: {id: SingleLayoutComponentId, icon: string, label: string}[] = [
    { id: 'editor', icon: 'pi pi-pencil', label: 'Edit' },
    { id: 'viewer', icon: 'pi pi-box', label: 'View' },
  ];
  if ((state.parameterSet?.parameters?.length ?? 0) > 0) {
    singleTargets.push({ id: 'customizer', icon: 'pi pi-sliders-h', label: 'Customize' });
  }
  const multiTargets = singleTargets;

  // Placeholder incremental event handlers
  const handleOpenClick = () => {
    console.log("UI Test: Open File Button Clicked");
    alert("Open File UI working smoothly!");
  };

  const handleSaveClick = () => {
    console.log("UI Test: Save File Button Clicked");
    alert("Save File UI working smoothly!");
  };

  const handleRefreshClick = () => {
    console.log("UI Test: Refresh Compiler Button Clicked");
    alert("Refresh UI working smoothly!");
  };

  return (
    <div className="">
      <div className='flex flex-row items-center' style={{
        margin: '5px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>

        {/* --- INCREMENTAL STEP 1: File Operations Button Group --- */}
        <div className="flex flex-row gap-1" style={{ display: 'flex', gap: '4px', margin: '5px' }}>
          <Button 
            icon="pi pi-folder-open" 
            label="Open" 
            className="p-button-outlined p-button-sm" 
            onClick={handleOpenClick} 
          />
          <Button 
            icon="pi pi-save" 
            label="Save" 
            className="p-button-outlined p-button-sm" 
            onClick={handleSaveClick} 
          />
          <Button 
            icon="pi pi-refresh" 
            label="Refresh" 
            className="p-button-outlined p-button-sm p-button-secondary" 
            onClick={handleRefreshClick} 
          />
        </div>

        {/* Existing View Control Toggles */}
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
      </div>
    </div>
  );
}