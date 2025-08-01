import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import Tooltip from "./Tooltip";

interface SettingProps {
  name: string;
  tooltip?: string;
}

interface ToggleSettingProps extends SettingProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

interface SliderSettingProps extends SettingProps {
  min?: number;
  max?: number;
  defaultValue: number[];

  onChange: (value: number[]) => void;
}

const ToggleSetting = (props: ToggleSettingProps) => {
  return (
    <div className="flex w-full flex-row items-center justify-between">
      <span className="text-left font-bold text-white">
        {props.name}{" "}
        {props.tooltip && (
          <Tooltip content={props.tooltip}>
            <span className="ml-0.5 cursor-help">&#9432;</span>
          </Tooltip>
        )}
      </span>
      <Switch />
    </div>
  );
};

const SliderSetting = (props: SliderSettingProps) => {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-x-2">
      <span className="text-left font-bold text-white">
        {props.name}{" "}
        {props.tooltip && (
          <Tooltip content={props.tooltip}>
            <span className="ml-0.5 cursor-help">&#9432;</span>
          </Tooltip>
        )}
      </span>
      <Slider
        min={props.min}
        max={props.max}
        defaultValue={props.defaultValue}
        onValueChange={props.onChange}
      />
    </div>
  );
};

export { ToggleSetting, SliderSetting };
