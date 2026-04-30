import Aurora from "@/components/Aurora";
import MovingAnimatedImage from "@/components/MovingAnimatedImage";
import Walking1 from "@/assets/animations/bevo/walking/1.png";
import Walking2 from "@/assets/animations/bevo/walking/2.png";
import Walking3 from "@/assets/animations/bevo/walking/3.png";
import Walking4 from "@/assets/animations/bevo/walking/4.png";
import Idle1 from "@/assets/animations/bevo/idle/1.png";
import Idle2 from "@/assets/animations/bevo/idle/2.png";
import LHD from "@/assets/images/LHD.jpeg";
import YikYak from "@/assets/images/YikYak.jpeg";
import { SliderSetting, ToggleSetting } from "@/components/Setting";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import * as storageItems from "@/lib/storage";
import { browser } from "wxt/browser";

function App() {
  const bevoWalkingFrames = [Walking1, Walking2, Walking3, Walking4];
  const bevoIdleFrames = [Idle1, Idle2];

  const [settings, setSettings] = useState({
    enabled: true,
    assignmentName: true,
    assignments: true,
    classroom: true,
    discussions: true,
    gradescope: true,
    quizzes: false,
    other: true,
    themedAnims: true,
    volume: 50,
    "stats-assignments": 0,
    "stats-classroom": 0,
    "stats-discussions": 0,
    "stats-gradescope": 0,
    "stats-other": 0,
    "stats-quizzes": 0,
    "stats-total": 0,
    clientId: 0,
  });

  const [imageVisible, setImageVisible] = useState(false);
  const [version, setVersion] = useState("");
  const [quote, setQuote] = useState("Hook 'em");
  const [wrappedEnabled, setWrappedEnabled] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const allSettings = await storageItems.getAllSettings();
      setSettings(allSettings);
    };
    const loadVersion = async () => {
      const manifest = browser.runtime.getManifest();
      setVersion(manifest.version);
    };
    const loadQuote = async () => {
      try {
        const response = await browser.runtime.sendMessage("quote");
        setQuote(response || "Hook 'em");
      } catch (error) {
        console.error("Error fetching quote:", error);
        setQuote("Hook 'em");
      }
    };
    const loadWrappedFlag = async () => {
      try {
        const response = await fetch(
          "https://www.aidenjohnson.dev/api/help-me-bevo-fflags",
        );
        if (!response.ok) return;
        const flags = await response.json();
        if (flags.Wrapped) setWrappedEnabled(true);
      } catch {}
    };
    loadSettings();
    loadVersion();
    loadQuote();
    loadWrappedFlag();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "w") setWrappedEnabled((prev) => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const updateSetting = async (key: string, value: any) => {
    await storageItems.setSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
    
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      if (tab && tab.id !== undefined) {
        switch (key) {
          case "enabled":
            await browser.tabs.sendMessage(tab.id, ["toggle", value]);
            break;
          case "volume":
            await browser.tabs.sendMessage(tab.id, ["updateVolume", Number(value)]);
            break;
          default:
            await browser.tabs.sendMessage(tab.id, ["changeValue", key, value]);
        }
      }
    } catch (error) {
    }
  };

  return (
    <div className={`relative w-96 bg-neutral-900 ${wrappedEnabled ? "h-100" : "h-87"}`}>
      <Aurora
        colorStops={["#BF5700", "#5B2F0B", "#5E3F1C"]}
        blend={1}
        amplitude={0.5}
        speed={0.5}
      />

      {/* relative so it appears over Aurora */}
      <div className="relative">
        <div className="flex flex-row items-center justify-between px-6 py-4">
          <div className="flex flex-col gap-y-0.5">
            <p className="text-4xl font-black text-white">
              Help Me <span className="text-[#bf5700]">Bevo</span>
            </p>
            <p className="text-xs text-neutral-300">
              Stay motivated submitting with Bevo
            </p>
          </div>
          <Button
            className={`h-12 w-12 font-bold ${
              settings.enabled ? "bg-green-500" : "bg-red-500"
            }`}
            onClick={() => updateSetting("enabled", !settings.enabled)}
          >
            {settings.enabled ? "ON" : "OFF"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6">
          <div className="flex flex-col gap-2">
            <div className={`flex flex-col gap-2 rounded-lg bg-black/30 px-3 py-2 ${!settings.enabled ? 'opacity-80 pointer-events-none' : ''}`}>
              <p className="text-lg font-black text-white">Canvas</p>
              <ToggleSetting
                name="Assignments"
                checked={settings.assignments}
                onChange={(checked) => updateSetting("assignments", checked)}
              />
              <ToggleSetting
                name="Quizzes"
                checked={settings.quizzes}
                onChange={(checked) => updateSetting("quizzes", checked)}
              />
              <ToggleSetting
                name="Discussions"
                checked={settings.discussions}
                onChange={(checked) => updateSetting("discussions", checked)}
              />
              <ToggleSetting
                name="Other"
                checked={settings.other}
                onChange={(checked) => updateSetting("other", checked)}
              />
            </div>

            <div className="w-full rounded-lg bg-black/30 px-3 py-2">
              <p className="text-md text-center font-medium text-white">
                {quote}
              </p>
            </div>

            {wrappedEnabled && (
              <Button
                className="h-7 w-full bg-[#bf5700] font-bold"
                onClick={() => browser.runtime.sendMessage("openWrapped")}
              >
                View Wrapped
              </Button>
            )}

            <div className="flex w-full flex-row gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="h-7 flex-1 bg-[#bf5700] font-bold">
                    Credits
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-none bg-neutral-800 text-white shadow">
                  <DialogHeader>
                    <DialogTitle className="font-black">Credits</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-row justify-between">
                      <p className="text-sm font-bold">Lead Developer</p>
                      <a href="https://www.instagram.com/aidenn.johnson/" target="_blank" rel="noopener noreferrer" className="text-sm text-[#bf5700] hover:underline">Aiden Johnson</a>
                    </div>
                    <div className="flex flex-row justify-between">
                      <p className="text-sm font-bold">Contributor</p>
                      <a href="https://www.instagram.com/ethan.lanting/" target="_blank" rel="noopener noreferrer" className="text-sm text-[#bf5700] hover:underline">Ethan Lanting</a>
                    </div>
                    <div className="flex flex-row justify-between">
                      <p className="text-sm font-bold">Pixel Art Bevo</p>
                      <p className="text-sm">Alex Bazan</p>
                    </div>
                    <div className="flex flex-row justify-between">
                      <p className="text-sm font-bold">
                        Original Bevo Animation
                      </p>
                      <a href="https://www.instagram.com/texasfootball" target="_blank" rel="noopener noreferrer" className="text-sm text-[#bf5700] hover:underline">Texas Football</a>
                    </div>

                    <p className="pt-2 text-center">
                      Thank you to whoever made the original{" "}
                      <span className="relative inline-block">
                        <span
                          className="cursor-pointer text-[#bf5700] underline"
                          onMouseEnter={() => setImageVisible(true)}
                          onMouseLeave={() => setImageVisible(false)}
                        >
                          YikYak post
                        </span>
                        <div
                          className={`absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform shadow-lg transition-all duration-200 ${imageVisible ? "visible opacity-100" : "invisible opacity-0"}`}
                        >
                          <img
                            src={YikYak}
                            alt="Original YikYak post"
                            className="h-auto w-48 max-w-none -translate-x-12 rounded-lg border border-neutral-600 shadow-lg"
                          />
                        </div>
                      </span>{" "}
                      coming up with the idea for this extension!
                    </p>

                    <div className="flex flex-row items-center justify-center gap-2 pt-2">
                      <img
                        src={LHD}
                        alt="LHD Logo"
                        className="h-5 w-5 rounded-sm"
                      />
                      <p className="">Adopted by Longhorn Developers</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="h-7 flex-1 bg-[#bf5700] font-bold">
                    Stats
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-none bg-neutral-800 text-white shadow">
                  <DialogHeader className="relative">
                    <p className="absolute left-0 top-0 text-xs text-neutral-400">v{version}</p>
                    <DialogTitle className="font-black">Statistics</DialogTitle>
                  </DialogHeader>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row justify-between rounded-lg bg-[#bf5700]/20 px-3 py-2">
                      <p className="text-sm font-black text-white">
                        Total Submissions
                      </p>
                      <p className="text-sm font-black text-[#bf5700]">
                        {settings["stats-total"]}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg bg-black/30 px-3 py-2">
                      <p className="text-sm font-black text-white">Canvas</p>
                      <div className="flex flex-row justify-between">
                        <p className="text-xs">Assignments</p>
                        <p className="text-xs font-bold">
                          {settings["stats-assignments"]}
                        </p>
                      </div>
                      <div className="flex flex-row justify-between">
                        <p className="text-xs">Quizzes</p>
                        <p className="text-xs font-bold">
                          {settings["stats-quizzes"]}
                        </p>
                      </div>
                      <div className="flex flex-row justify-between">
                        <p className="text-xs">Discussions</p>
                        <p className="text-xs font-bold">
                          {settings["stats-discussions"]}
                        </p>
                      </div>
                      <div className="flex flex-row justify-between">
                        <p className="text-xs">Other</p>
                        <p className="text-xs font-bold">
                          {settings["stats-other"]}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 rounded-lg bg-black/30 px-3 py-2">
                      <p className="text-sm font-black text-white">
                        Integrations
                      </p>
                      <div className="flex flex-row justify-between">
                        <p className="text-xs">Gradescope</p>
                        <p className="text-xs font-bold">
                          {settings["stats-gradescope"]}
                        </p>
                      </div>
                      <div className="flex flex-row justify-between">
                        <p className="text-xs">Google Classroom</p>
                        <p className="text-xs font-bold">
                          {settings["stats-classroom"]}
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className={`flex flex-col gap-2 rounded-lg bg-black/30 px-3 py-2 ${!settings.enabled ? 'opacity-80 pointer-events-none' : ''}`}>
              <p className="text-lg font-black text-white">Integrations</p>
              <ToggleSetting
                name="Gradescope"
                checked={settings.gradescope}
                onChange={(checked) => updateSetting("gradescope", checked)}
              />
              <ToggleSetting
                name="G. Classroom"
                checked={settings.classroom}
                onChange={(checked) => updateSetting("classroom", checked)}
              />
            </div>
            <div className={`flex flex-col gap-2 rounded-lg bg-black/30 px-3 py-2 ${!settings.enabled ? 'opacity-80 pointer-events-none' : ''}`}>
              <p className="text-lg font-black text-white">Display</p>
              <SliderSetting
                name="Volume"
                min={0}
                max={100}
                value={[settings.volume]}
                onChange={(value) => updateSetting("volume", value[0])}
              />
              <ToggleSetting
                name="Tailor Names"
                tooltip="Display names of assignments over the animation. If disabled, the old YOUR ASSIGNMENT animation will play. We don't store your assignment names, don't worry!"
                checked={settings.assignmentName}
                onChange={(checked) => updateSetting("assignmentName", checked)}
              />
              <ToggleSetting
                name="Theme Anims"
                tooltip="Show the themed animation (like the oppontent slander edits) when you submit assignments.\n\nIf this is enabled and it's the default animation, there is no themed animation released at the moment."
                checked={settings.themedAnims}
                onChange={(checked) => updateSetting("themedAnims", checked)}
              />
            </div>
          </div>
        </div>
      </div>

      <MovingAnimatedImage
        images={bevoWalkingFrames}
        idleImages={bevoIdleFrames}
        interval={200}
        idleInterval={600}
        className="pointer-events-none h-16 w-21"
        alt="Moving Bevo"
        containerWidth={384}
        speed={1}
        stopChance={0.015}
        idleTimeMin={800}
        idleTimeMax={2500}
        directionChangeChance={0.4}
        movementTickRate={40}
      />
    </div>
  );
}

export default App;
