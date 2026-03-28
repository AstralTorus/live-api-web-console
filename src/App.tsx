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

import { useRef, useState } from "react";
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import SidePanel from "./components/side-panel/SidePanel";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import { LiveClientOptions } from "./types";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function App() {
  const [step, setStep] = useState(1);
  const [selectedSituation, setSelectedSituation] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("Puck");

  const videoRef = useRef<HTMLVideoElement>(null);

  const apiOptions = {
    apiKey: API_KEY,
    model: "models/gemini-3.1-flash-live-preview",
    generationConfig: {
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "selectedSpeaker",
          }
        }
      }
    },
    systemInstruction: {
      parts: [
        {
          text: 'Pretend you are working in a hackathon with me.',
        }
      ]
    }
  };
  
  return (
    <div className="App">
      {step === 1 && (
        <div className="situation-selection">
          <h1>What is your situation?</h1>
          <button onClick={() => {setSelectedSituation("hackathon"); setStep(2)}}>I am in a hackathon and want to use the API for help</button>
          <button onClick={() => {setSelectedSituation("exploring"); setStep(2)}}>I am just exploring the API</button>
        </div>
      )}

      {step === 2 && (
        <div className="speaker-selection">
          <h1>Who do you want to talk to?</h1>
          <button onClick={() => {setSelectedSpeaker("Puck"); setStep(3)}}>Male</button>
          <button onClick={() => {setSelectedSpeaker("Aoede"); setStep(3)}}>Female</button>
          <button className="secondary" onClick={() => setStep(1)}>Back</button>
        </div>
      )}

      {step === 3 && (
      <LiveAPIProvider options={apiOptions}>
        <div className="streaming-console">
          <SidePanel />
          <main>
            <div className="main-app-area">
              {/* APP goes here */}
              <Altair />
              <button className="exit-btn" onClick={() => setStep(1)}>End Call</button>
            </div>

            <ControlTray
              videoRef={videoRef}
              supportsVideo={false}
              onVideoStreamChange={() => {}}
              enableEditingSettings={true}
            >
              {/* put your own buttons here */}
            </ControlTray>
          </main>
        </div>
      </LiveAPIProvider>
    )}
    </div>
  );
}

export default App;
