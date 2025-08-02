import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import Tooltip from "./Tooltip";
import { useState, useEffect } from "react";

interface SettingProps {
  name: string;
  tooltip?: string;
}

interface ToggleSettingProps extends SettingProps {
  storageKey?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

interface SliderSettingProps extends SettingProps {
  storageKey?: string;
  min?: number;
  max?: number;
  value?: number[];
  onChange?: (value: number[]) => void;
}

const ToggleSetting = (props: ToggleSettingProps) => {
  const [checked, setChecked] = useState(props.checked ?? false);

  useEffect(() => {
    if (props.checked !== undefined) {
      setChecked(props.checked);
    }
  }, [props.checked]);

  const handleChange = (newChecked: boolean) => {
    setChecked(newChecked);
    props.onChange?.(newChecked);
  };

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
      <Switch checked={checked} onCheckedChange={handleChange} />
    </div>
  );
};

const SliderSetting = (props: SliderSettingProps) => {
  const [value, setValue] = useState(props.value ?? [50]);

  useEffect(() => {
    if (props.value !== undefined) {
      setValue(props.value);
    }
  }, [props.value]);

  const handleChange = (newValue: number[]) => {
    setValue(newValue);
    props.onChange?.(newValue);
  };

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
        value={value}
        onValueChange={handleChange}
      />
    </div>
  );
};

export { ToggleSetting, SliderSetting };
