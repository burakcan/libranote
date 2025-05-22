"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { TextPreview } from "@/components/settings/TextPreview";
import { ThemePreview } from "@/components/settings/ThemePreview";
import { useSetting } from "@/hooks/useSetting";

const availableThemes = [
  { value: "cosmic", label: "Cosmic" },
  { value: "cream", label: "Cream" },
  { value: "forest", label: "Forest" },
  { value: "mint", label: "Mint" },
  { value: "sunset", label: "Sunset" },
  { value: "monochrome", label: "Monochrome" },
];

export function AppearanceSettings() {
  const { value: themeMode, setValue: setThemeMode } = useSetting(
    "appearance.themeMode"
  );
  const { value: lightTheme, setValue: setLightTheme } = useSetting(
    "appearance.lightTheme"
  );
  const { value: darkTheme, setValue: setDarkTheme } = useSetting(
    "appearance.darkTheme"
  );
  const [headingFont, setHeadingFont] = useState("inter");
  const [contentFont, setContentFont] = useState("inter");
  const [codeFont, setCodeFont] = useState("monospace");
  const [lineHeight, setLineHeight] = useState(1.6);
  const [fontSize, setFontSize] = useState("medium");

  const availableFonts = [
    { value: "inter", label: "Inter" },
    { value: "roboto", label: "Roboto" },
    { value: "lato", label: "Lato" },
    { value: "merriweather", label: "Merriweather" },
    { value: "monospace", label: "Monospace" },
  ];

  // Shared text preview component for both font family and font size sections
  const textPreview = (
    <TextPreview
      fontSize={fontSize}
      headingFont={headingFont}
      contentFont={contentFont}
      codeFont={codeFont}
      lineHeight={lineHeight}
    />
  );

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Theme">
        <div className="space-y-6">
          <RadioGroup
            value={themeMode as string}
            onValueChange={setThemeMode}
            className="grid grid-cols-3 gap-2"
          >
            <Label className="flex items-center border rounded-md p-3">
              <RadioGroupItem value="light" id="light" />
              <span>Light</span>
            </Label>
            <Label className="flex items-center border rounded-md p-3">
              <RadioGroupItem value="dark" id="dark" />
              <span>Dark</span>
            </Label>
            <Label className="flex items-center border rounded-md p-3">
              <RadioGroupItem value="system" id="system" />
              <span>System Default</span>
            </Label>
          </RadioGroup>

          <div className="grid grid-cols-2 gap-2">
            {(themeMode === "light" || themeMode === "system") && (
              <div className="space-y-2">
                <Label htmlFor="light-theme">Light Theme</Label>
                <Select
                  value={lightTheme as string}
                  onValueChange={setLightTheme}
                >
                  <SelectTrigger
                    id="light-theme"
                    className="flex justify-between items-center w-full pl-px"
                  >
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableThemes.map((theme) => (
                      <SelectItem
                        key={theme.value}
                        value={theme.value}
                        className="flex items-center gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <ThemePreview theme={theme.value} isDark={false} />
                          {theme.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(themeMode === "dark" || themeMode === "system") && (
              <div className="space-y-2">
                <Label htmlFor="dark-theme">Dark Theme</Label>
                <Select
                  value={darkTheme as string}
                  onValueChange={setDarkTheme}
                >
                  <SelectTrigger
                    id="dark-theme"
                    className="flex justify-between items-center w-full pl-px"
                  >
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableThemes.map((theme) => (
                      <SelectItem
                        key={theme.value}
                        value={theme.value}
                        className="flex items-center gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <ThemePreview theme={theme.value} isDark={true} />
                          {theme.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Font Family">
        <div className="grid grid-cols-2 gap-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heading-font">Headings Font</Label>
            <Select value={headingFont} onValueChange={setHeadingFont}>
              <SelectTrigger id="heading-font" className="w-full">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {availableFonts.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-font">Content Font</Label>
            <Select value={contentFont} onValueChange={setContentFont}>
              <SelectTrigger id="content-font" className="w-full">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {availableFonts.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code-font">Code Font</Label>
            <Select value={codeFont} onValueChange={setCodeFont}>
              <SelectTrigger id="code-font" className="w-full">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {availableFonts
                  .filter((f) => f.value === "monospace")
                  .map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div />

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="line-height">
                Line Height: {lineHeight.toFixed(1)}
              </Label>
            </div>
            <Slider
              id="line-height"
              min={1.2}
              max={2.0}
              step={0.1}
              value={[lineHeight]}
              onValueChange={(value) => setLineHeight(value[0])}
              className="py-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <RadioGroup
              value={fontSize}
              onValueChange={setFontSize}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small" id="small" />
                <Label htmlFor="small">Small</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large" id="large" />
                <Label htmlFor="large">Large</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="mt-4">{textPreview}</div>
      </SettingsSection>
    </div>
  );
}
