import React, { useState } from 'react';
import AppearanceSettings from './AppearanceSettings.jsx';
import AgentConfig from './AgentConfig.jsx';
import ContentFilters from './ContentFilters.jsx';
import SecuritySettings from './SecuritySettings.jsx';
import ButtonLabelsSettings from './ButtonLabelsSettings.jsx';
import '../styles/SettingsPanel.css';

const TABS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'agents', label: 'Agents' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'filters', label: 'Content filters' },
  { id: 'security', label: 'Security' },
];

export default function SettingsPanel({
  onClose,
  appSettings,
  onUpdateAppSettings,
  agents,
  activeAgent,
  onSelectAgent,
  onAgentsChanged,
  forbiddenWords,
  onSaveForbiddenWords,
  passwordEnabled,
  onPasswordStatusChange,
}) {
  const [activeTab, setActiveTab] = useState('appearance');

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>Settings</h2>
        <button onClick={onClose} className="btn-close">×</button>
      </div>

      <div className="settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-body">
        {activeTab === 'appearance' && (
          <AppearanceSettings settings={appSettings} onUpdate={onUpdateAppSettings} />
        )}
        {activeTab === 'agents' && (
          <div className="settings-agents-wrap">
            <AgentConfig
              agents={agents}
              activeAgent={activeAgent}
              onSelectAgent={onSelectAgent}
              onAgentsChanged={onAgentsChanged}
              onClose={() => {}}
              buttonLabels={appSettings.buttonLabels}
              embedded
            />
          </div>
        )}
        {activeTab === 'buttons' && (
          <ButtonLabelsSettings
            buttonLabels={appSettings.buttonLabels}
            onUpdate={onUpdateAppSettings}
          />
        )}
        {activeTab === 'filters' && (
          <ContentFilters words={forbiddenWords} onSave={onSaveForbiddenWords} />
        )}
        {activeTab === 'security' && (
          <SecuritySettings
            passwordEnabled={passwordEnabled}
            onStatusChange={onPasswordStatusChange}
          />
        )}
      </div>
    </div>
  );
}
