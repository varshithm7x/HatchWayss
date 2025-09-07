"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/services/firebase/client";
import { signIn, signUp } from "@/lib/actions/auth.actions";

type FormType = "sign-in" | "sign-up";

const getFormSchema = (type: FormType) =>
  z.object({
    name: type === "sign-up" ? z.string() : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(8, "Password must be 8 char"),
  });

function AuthForm({ type }: { type: FormType }) {
  const formSchema = getFormSchema(type);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const isSignIn = type == "sign-in";

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log(isSignIn, values);
      if (isSignIn) {
        const { email, password } = values;

        const userCreds = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const token = await userCreds.user.getIdToken();

        if (!token) {
          toast.error("Sign In Failed");
          return;
        }

        await signIn({ email, idToken: token });

        toast.success("Sign In Success");
        router.push("/");
        form.reset();
      } else {
        const { name, email, password } = values;

        const userCreds = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const { success, message } = await signUp({
          uid: userCreds.user.uid,
          name: name!,
          email,
          password,
        });

        if (!success) {
          toast.error(message);
          return;
        }

        toast.success("Account Created Now Pls Log In");
        router.push("/sign-in");
        form.reset();
      }
    } catch (error) {
      console.log(error);
      toast.error(`There was Error ${(error as Error).message}`);
    }
  }

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/new-logo.png" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">Hatchways</h2>
        </div>

        <h3>Practice job interviews with AI</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label">Name</FormLabel>
                    <FormControl>
                      <Input className="input" {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="label">Email</FormLabel>
                  <FormControl>
                    <Input className="input" {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="label">Password</FormLabel>
                  <FormControl>
                    <Input className="input" {...field} type="password" />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="btn" type="submit">
              {isSignIn ? "Sign In" : "Create an Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default AuthForm;
