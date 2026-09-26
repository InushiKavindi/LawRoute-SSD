import { Button } from "@/components/ui/button";
import { GoogleLogin } from "@react-oauth/google";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ROLE_OPTIONS = [
  { value: "user", label: "Citizen" },
  { value: "lawyer", label: "Lawyer" },
];

export default function SignUpForm({
  idPrefix,
  values,
  onChange,
  onSubmit,
  onSwitchToSignIn,
  busy,
  error,
}) {
  return (
    <form
      className="w-full"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <FieldGroup>
        <div className="flex items-center gap-4">
          <Label className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap">I am a</Label>
          <RadioGroup
            value={values.role}
            onValueChange={(role) => onChange({ ...values, role })}
            className="flex flex-row gap-6"
          >
            {ROLE_OPTIONS.map((opt) => {
              const id = `${idPrefix}-role-${opt.value}`;
              return (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={id} />
                  <Label htmlFor={id} className="cursor-pointer font-medium">{opt.label}</Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>
        
        <div className="w-full border-t border-muted-foreground/20 my-6"></div>

        <Field>
          <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
          <Input
            id={`${idPrefix}-name`}
            type="text"
            placeholder="Your name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => onChange({ ...values, name: e.target.value })}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${idPrefix}-email`}>Email</FieldLabel>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={values.email}
            onChange={(e) => onChange({ ...values, email: e.target.value })}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${idPrefix}-password`}>Password</FieldLabel>
          <Input
            id={`${idPrefix}-password`}
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => onChange({ ...values, password: e.target.value })}
            required
            minLength={8}
          />
          <FieldDescription>
            8+ chars, include letter, number, special.
          </FieldDescription>
        </Field>


        {error ? (
          <Field>
            <FieldDescription className="text-destructive">
              {error}
            </FieldDescription>
          </Field>
        ) : null}

        <Field>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating account..." : "Sign up"}
          </Button>
        </Field>

        <Field>
          <div className="flex w-full items-center justify-center my-2">
            <span className="w-full border-t border-muted-foreground/30"></span>
            <span className="px-3 text-sm text-muted-foreground">or</span>
            <span className="w-full border-t border-muted-foreground/30"></span>
          </div>
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={(credentialResponse) => onSubmit({ googleToken: credentialResponse.credential, role: values.role })}
              onError={() => console.error("Google Sign Up Failed")}
            />
          </div>
        </Field>

        <Field>
          <FieldDescription>
            Already have an account?{" "}
            <button
              type="button"
              className="font-medium text-foreground hover:underline"
              onClick={onSwitchToSignIn}
            >
              Log in
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
