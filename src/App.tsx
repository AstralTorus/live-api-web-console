/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useRef, useState, useEffect } from "react";
import "./App.scss";
import { LiveAPIProvider, useLiveAPIContext } from "./contexts/LiveAPIContext";
import {
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";
import SidePanel from "./components/side-panel/SidePanel";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import { MdMicOff, MdKeyboard, MdVolumeUp, MdAddCall, MdVideocam, MdContactMail, MdCallEnd, MdInfo } from "react-icons/md";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;

// --- 1. THE ACTUAL CALL COMPONENT ---
// This component lives INSIDE the Provider so it can use 'disconnect()'
function ActiveCall({ selectedSpeaker, selectedSituation, onEnd, formatTime }: any) {
  const { connected, connect, disconnect, setConfig, setModel } = useLiveAPIContext();
  const [callTime, setCallTime] = useState(0);
  const dummyVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const persona = selectedSpeaker === "Puck" || selectedSpeaker === "Aoede" ? "partner" : "parent";
  
      setModel("models/gemini-2.5-flash-native-audio-preview-12-2025");
      setConfig({
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: selectedSpeaker,
            },
          },
        },
      systemInstruction: {
        parts: [{
          text: `You are the user's ${persona}. Scenario: ${selectedSituation}. 
                 Be brief, realistic, and use natural phone dialogue. 
                 If you are a parent, you are firm and need them home. 
                 If you are a partner, you are protective and arriving now.`
        }],
      },
    });
  }, [selectedSpeaker, selectedSituation, setConfig, setModel]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!connected) connect();
    }, 500);

    // Cleanup: Disconnect when leaving the screen
    return () => { 
      clearTimeout(timer);
      disconnect(); };
  }, [connect, disconnect]);

  // 2. EFFECT: Timer logic
  useEffect(() => {
    const interval = setInterval(() => setCallTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleHangUp = () => {
    console.log("Cutting the line...");
    
    // Kill the WebSocket connection
    disconnect();

    window.stop();

    // Kill audio
    const audioElements = document.querySelectorAll("audio, video");
    audioElements.forEach((el: any) => {
      el.pause();
      el.src = "";
      el.load();
    });

    onEnd();
  };

  return (
    <div className="iphone-call-screen">
      <div className="notch"></div>
      <div className="call-container">
        <div className="call-content">
          <div className="profile-section">
            <h2 className="caller-name">
              {selectedSpeaker === "Puck" ? "Your Partner" : "Your Parent"}
            </h2>
            <p className="call-timer">
              {connected ? formatTime(callTime) : "Connecting..."}
            </p>
          </div>

          <div className="call-actions">
             {/* Static UI Buttons - No logic needed per your request */}
            <div className="action-item"><button className="call-action-btn"><MdMicOff className="action-icon" /></button><span className="action-label">Mute</span></div>
            <div className="action-item"><button className="call-action-btn"><MdKeyboard className="action-icon" /></button><span className="action-label">Keypad</span></div>
            <div className="action-item"><button className="call-action-btn"><MdVolumeUp className="action-icon" /></button><span className="action-label">Audio</span></div>
            <div className="action-item"><button className="call-action-btn"><MdAddCall className="action-icon" /></button><span className="action-label">Add call</span></div>
            <div className="action-item"><button className="call-action-btn"><MdVideocam className="action-icon" /></button><span className="action-label">FaceTime</span></div>
            <div className="action-item"><button className="call-action-btn"><MdContactMail className="action-icon" /></button><span className="action-label">Contacts</span></div>
          </div>

          <div className="spacer-bottom"></div>

          <button className="end-call-btn" onClick={onEnd}>
            <MdCallEnd className="end-icon" />
          </button>

          <div className="debug-console" style={{  
            background: "#1e1e1e",
            color: "white",
            padding: "10px"
          }}>
            <h3>DEBUG CONSOLE</h3>
            <SidePanel />
            <Altair />
            <ControlTray 
              videoRef={dummyVideoRef} 
              supportsVideo={false} 
              onVideoStreamChange={() => {}} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 2. THE MAIN APP WRAPPER ---
function App() {
  const [step, setStep] = useState(1);
  const [selectedSituation, setSelectedSituation] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const personaPrompt = selectedSpeaker === "Puck" 
    ? "You are the user's partner. You are 2 minutes away. Keep responses brief (10 words max) and protective."
    : "You are the user's parent. You need them to come home for a family emergency. Be firm and brief.";

  const apiOptions = {
    apiKey: API_KEY,
    model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
    generationConfig: {
      responseModalities: [Modality.AUDIO],
    },
    speechConfig: { 
      voiceConfig: 
        { prebuiltVoiceConfig: { voiceName: selectedSpeaker }, },
    },
    systemInstruction: { parts: [{ text: personaPrompt }] }
  };

  return (
    <div className="App">
      {step === 1 && (
        <div className="situation-selection">
          <h1>Safety Dial</h1>
          <p className="subtitle">
            A call from a partner or parent can help you escape an unsafe situation, but they might not always be available. Start an on-demand call with an AI that acts as a loved one to deter an unwanted stalker or find an excuse to safely leave.
          </p>
          <div className="button-group">
            <button onClick={() => {setSelectedSituation("stalker"); setStep(2)}}>Someone is following me</button>
            <button onClick={() => {setSelectedSituation("party"); setStep(2)}}>I need to leave a party</button>
            <button onClick={() => {setSelectedSituation("pressure"); setStep(2)}}>Someone is pressuring me to go out with them</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="speaker-selection">
          <h1>Who should call?</h1>
          <div className="button-group">
            
            {/* 1. Show Partner options for 'stalker' or 'pressure' */}
            {(selectedSituation === "stalker" || selectedSituation === "pressure") && (
              <>
                <button onClick={() => {setSelectedSpeaker("Puck"); setStep(3)}}>Boyfriend</button>
                <button onClick={() => {setSelectedSpeaker("Aoede"); setStep(3)}}>Girlfriend</button>
              </>
            )}

            {/* 2. Show Parent options for 'stalker' or 'party' */}
            {(selectedSituation === "stalker" || selectedSituation === "party") && (
              <>
                <button onClick={() => {setSelectedSpeaker("Iapetus"); setStep(3)}}>Dad</button>
                <button onClick={() => {setSelectedSpeaker("Autonoe"); setStep(3)}}>Mom</button>
              </>
            )}

          </div>
          <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
        </div>
      )}

      {step === 3 && (
        <LiveAPIProvider options={apiOptions}>
          <ActiveCall 
            selectedSpeaker={selectedSpeaker} 
            selectedSituation={selectedSituation}
            onEnd={() => setStep(1)}
            formatTime={formatTime}
          />
        </LiveAPIProvider>
      )}
    </div>
  );
}

export default App;