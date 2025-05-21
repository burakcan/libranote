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

export function AppearanceSettings() {
  const [themeMode, setThemeMode] = useState("system");
  const [lightTheme, setLightTheme] = useState("default");
  const [darkTheme, setDarkTheme] = useState("dark");
  const [headingFont, setHeadingFont] = useState("inter");
  const [contentFont, setContentFont] = useState("inter");
  const [codeFont, setCodeFont] = useState("monospace");
  const [lineHeight, setLineHeight] = useState(1.6);
  const [fontSize, setFontSize] = useState("medium");

  const availableThemes = [
    { value: "default", label: "Default" },
    { value: "rose", label: "Rose" },
    { value: "green", label: "Green" },
    { value: "blue", label: "Blue" },
    { value: "orange", label: "Orange" },
    { value: "purple", label: "Purple" },
  ];

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
    <div className="space-y-6">
      <SettingsSection title="Theme">
        <div className="space-y-4">
          <RadioGroup
            value={themeMode}
            onValueChange={setThemeMode}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light">Light</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark">Dark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system">System Default</Label>
            </div>
          </RadioGroup>

          {themeMode === "light" && (
            <div className="space-y-2">
              <Label htmlFor="light-theme">Light Theme</Label>
              <Select value={lightTheme} onValueChange={setLightTheme}>
                <SelectTrigger
                  id="light-theme"
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <SelectValue placeholder="Select a theme" />
                  </div>
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

          {themeMode === "dark" && (
            <div className="space-y-2">
              <Label htmlFor="dark-theme">Dark Theme</Label>
              <Select value={darkTheme} onValueChange={setDarkTheme}>
                <SelectTrigger
                  id="dark-theme"
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <SelectValue placeholder="Select a theme" />
                  </div>
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

          {themeMode === "system" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="system-light-theme">Light Theme</Label>
                <Select value={lightTheme} onValueChange={setLightTheme}>
                  <SelectTrigger
                    id="system-light-theme"
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <SelectValue placeholder="Select a theme" />
                    </div>
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

              <div className="space-y-2">
                <Label htmlFor="system-dark-theme">Dark Theme</Label>
                <Select value={darkTheme} onValueChange={setDarkTheme}>
                  <SelectTrigger
                    id="system-dark-theme"
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <SelectValue placeholder="Select a theme" />
                    </div>
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
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title="Font Family">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="heading-font">Headings Font</Label>
            <Select value={headingFont} onValueChange={setHeadingFont}>
              <SelectTrigger id="heading-font">
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
              <SelectTrigger id="content-font">
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
              <SelectTrigger id="code-font">
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
        </div>

        <div className="mt-4">{textPreview}</div>
      </SettingsSection>

      <SettingsSection title="Font Size">
        <div className="space-y-4">
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

          {textPreview}
        </div>
      </SettingsSection>
    </div>
  );
}
