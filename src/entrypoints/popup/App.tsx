import Aurora from "@/components/Aurora";
import MovingAnimatedImage from "@/components/MovingAnimatedImage";
import Walking1 from "@/assets/animations/bevo/walking/1.png";
import Walking2 from "@/assets/animations/bevo/walking/2.png";
import Walking3 from "@/assets/animations/bevo/walking/3.png";
import Walking4 from "@/assets/animations/bevo/walking/4.png";
import Idle1 from "@/assets/animations/bevo/idle/1.png";
import Idle2 from "@/assets/animations/bevo/idle/2.png";
import { SliderSetting, ToggleSetting } from "@/components/Setting";
import { Button } from "@/components/ui/button";

function App() {
  const bevoWalkingFrames = [Walking1, Walking2, Walking3, Walking4];
  const bevoIdleFrames = [Idle1, Idle2];

  return (
    <div className="relative h-87 w-96 bg-neutral-900">
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
          <Button className="h-12 w-12 bg-[#bf5700] font-bold">ON</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 rounded-lg bg-black/30 px-3 py-2">
              <p className="text-lg font-black text-white">Canvas</p>
              <ToggleSetting name="Assignments" />
              <ToggleSetting name="Quizzes" />
              <ToggleSetting name="Discussions" />
              <ToggleSetting name="Other" />
            </div>

            <div className="w-full rounded-lg bg-black/30 px-3 py-2">
              <p className="text-md text-center font-medium text-white">
                Hook 'em
              </p>
            </div>

            <div className="flex w-full flex-row gap-2">
              <Button className="h-7 flex-1 bg-[#bf5700] font-bold">
                Credits
              </Button>
              <Button className="h-7 flex-1 bg-[#bf5700] font-bold">
                Stats
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 rounded-lg bg-black/30 px-3 py-2">
              <p className="text-lg font-black text-white">Integrations</p>
              <ToggleSetting name="Gradescope" />
              <ToggleSetting name="G. Classroom" />
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-black/30 px-3 py-2">
              <p className="text-lg font-black text-white">Display</p>
              <SliderSetting
                name="Volume"
                min={0}
                max={100}
                defaultValue={[50]}
                onChange={function (value: number[]): void {}}
              />
              <ToggleSetting
                name="Tailor Names"
                tooltip="Display names of assignments over the animation. If disabled, the old YOUR ASSIGNMENT animation will play. We don't store your assignment names, don't worry!"
              />
              <ToggleSetting
                name="Theme Anims"
                tooltip="Show the themed animation (like the oppontent slander edits) when you submit assignments.

If this is enabled and it's the default animation, there is no themed animation released at the moment."
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
        className="h-16 w-21"
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
