// Top-level build file where you can add configuration options common to all sub-projects/modules.

plugins {
    id("com.android.application") version "8.0.0" apply false
    id("com.android.library") version "8.0.0" apply false
    id("org.jetbrains.kotlin.android") version "1.8.0" apply false
}

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.1.1") // Make sure this is the latest version
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.0")
    }
}


allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
