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
  const { value: headingFont, setValue: setHeadingFont } = useSetting(
    "appearance.headingFontFamily"
  );
  const { value: contentFont, setValue: setContentFont } = useSetting(
    "appearance.contentFontFamily"
  );
  const { value: codeFont, setValue: setCodeFont } = useSetting(
    "appearance.codeFontFamily"
  );
  const { value: lineHeight, setValue: setLineHeight } = useSetting(
    "appearance.lineHeight"
  );
  const { value: fontSize, setValue: setFontSize } = useSetting(
    "appearance.fontSize"
  );

  const availableContentFonts = [
    { value: "system", label: "System" },
    { value: "Inter", label: "Inter" },
    { value: "Roboto", label: "Roboto" },
    { value: "Open_Sans", label: "Open Sans" },
    { value: "Lora", label: "Lora" },
    { value: "Playfair_Display", label: "Playfair Display" },
  ];

  const availableCodeFonts = [
    { value: "system", label: "System" },
    { value: "Source_Code_Pro", label: "Source Code Pro" },
    { value: "Fira_Code", label: "Fira Code" },
    { value: "IBM_Plex_Mono", label: "IBM Plex Mono" },
  ];

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heading-font">Headings Font</Label>
            <Select
              value={headingFont as string}
              onValueChange={setHeadingFont}
            >
              <SelectTrigger id="heading-font" className="w-full">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {availableContentFonts.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-font">Content Font</Label>
            <Select
              value={contentFont as string}
              onValueChange={setContentFont}
            >
              <SelectTrigger id="content-font" className="w-full">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {availableContentFonts.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code-font">Code Font</Label>
            <Select value={codeFont as string} onValueChange={setCodeFont}>
              <SelectTrigger id="code-font" className="w-full">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {availableCodeFonts.map((font) => (
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
                Line Height: {(lineHeight as number).toFixed(1)}
              </Label>
            </div>
            <Slider
              id="line-height"
              min={1.2}
              max={2.0}
              step={0.1}
              value={[lineHeight as number]}
              onValueChange={(value) => setLineHeight(value[0])}
              className="py-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <RadioGroup
              value={fontSize as string}
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

        <div className="mt-4">
          <TextPreview />
        </div>
      </SettingsSection>
    </div>
  );
}
