"use client";
import React, { FC } from "react";
import { Mail, RectangleEllipsis, User } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import SignUpButton from "../SignUpButton";

type FormInputPost = {
  email: string;
  username: string;
  password: string;
};

interface ErrorResponse {
  message: string;
}
const SignUp = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputPost>();

  const submit: SubmitHandler<FormInputPost> = (data) => {
    console.log(data);
    addUser(data);
  };

  const {
    mutate: addUser,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: (newUserData: FormInputPost) => {
      return axios.post("/api/user", newUserData);
    },
    onError: (error) => {
      console.error("Error adding User:", error);
    },
    onSuccess: () => {
      router.push("/sign-in");
      console.log("User added successfully");
    },
  });
  const errorMessage = isError
    ? (error as AxiosError<ErrorResponse>)?.response?.data?.message
    : null;
  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex flex-col gap-5 p-5 w-fit border m-auto mt-32 bg-slate-200"
    >
      <div>
        <label className="input input-bordered flex items-center gap-2">
          <Mail />
          <input
            type="email"
            className="grow"
            placeholder="Email"
            {...register("email", {
              required: true,
            })}
          />
        </label>{" "}
        {errors.email && (
          <span className="text-red-600 prose">{errors.email?.message}</span>
        )}
      </div>
      <div>
        <label className="input input-bordered flex items-center gap-2">
          <User />
          <input
            type="text"
            className="grow"
            placeholder="Username"
            {...register("username", {
              required: true,
              pattern: {
                value: /^[a-zA-Z0-9_-]{3,20}$/,
                message: "Invalid Username",
              },
              minLength: {
                value: 3,
                message: "Username must be at least 3 characters",
              },
              maxLength: {
                value: 20,
                message: "Username must be less than 20 characters",
              },
            })}
          />
        </label>
        {errors.username && (
          <span className="text-red-600 prose ">
            {errors.username?.message}
          </span>
        )}
      </div>
      <div>
        <label className="input input-bordered flex items-center gap-2">
          <RectangleEllipsis />
          <input
            type="password"
            className="grow"
            placeholder="Password"
            {...register("password", {
              required: true,

              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
          />
        </label>
        {errors.password && (
          <span className="text-red-600">{errors.password?.message}</span>
        )}
      </div>
      <div>
        <button
          type="submit"
          className={`btn w-full ${isPending ? "btn-primary" : "btn-neutral"}`}
          disabled={isPending} // Disable button when loading
        >
          {isPending ? (
            <span className="loading loading-spinner"></span>
          ) : (
            "Sign Up"
          )}
        </button>
      </div>
      {isError && (
        <span className="text-red-600 text-center">
          {errorMessage || "Error Occured"}
        </span>
      )}
    </form>
  );
};

export default SignUp;
