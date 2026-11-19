"use client";
import React, { FC, useState } from "react";
import { Mail, RectangleEllipsis, User } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";

import { useRouter } from "next/navigation";

import { signIn } from "@/lib/actions/auth-actions";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { AuthCard, AuthField } from "./AuthCard";
import { SocialButtons } from "./SocialButtons";

type FormInputPost = {
  email: string;
  username: string;
  password: string;
};

const SignIn = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputPost>();

  const onSubmit: SubmitHandler<FormInputPost> = async (data) => {
    try {
      const result = await signIn(data.email, data.password);
      if (!result.user) {
        setError("Invalid email or password");
      }
    } catch (error) {
      setError("An error occurred");
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to view your collection."
      footer={
        <>
          New here?{" "}
          <Link href="/sign-up" className="link link-hover font-medium">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <AuthField
          label="Email"
          icon={<Mail />}
          error={errors.email && "Enter your email"}
        >
          <input
            type="email"
            className="grow"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email", { required: true })}
          />
        </AuthField>
        <AuthField
          label="Password"
          icon={<RectangleEllipsis />}
          error={
            errors.password?.message ||
            (errors.password && "Enter your password")
          }
        >
          <input
            type="password"
            className="grow"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register("password", {
              required: true,
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
          />
        </AuthField>
        {error.length > 0 && <p className="text-error text-sm">{error}</p>}
        <button
          type="submit"
          className="btn btn-primary mt-1 w-full font-serif"
        >
          Sign in
        </button>
      </form>

      <div className="divider my-0 text-xs opacity-60">or</div>

      <SocialButtons />
    </AuthCard>
  );
};

export default SignIn;
