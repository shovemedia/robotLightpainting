/************************************************************************
* File Name          : RemoteControl
* Author             : Evan
* Updated            : Evan
* Version            : V0.0.2
* Date               : 8 June, 2014
* Description        : Mouse Control or Leap Motion Control(Processing)
* License            : 
* Copyright(C) 2014 UFactory Team. All right reserved.
*************************************************************************/
#include <EEPROM.h>
#include <UF_uArm.h>

int  heightTemp  = 0, stretchTemp = 0, rotationTemp = 0, handRotTemp = 0, movesCompleted = 0;
char stateMachine = 0, counter = 0;
char dataBuf[9] = {0};

UF_uArm uarm;           // initialize the uArm library 

void setup() 
{
  Serial.begin(9600);  // start serial port at 9600 bps
//  while(!Serial);     // wait for serial port to connect. Needed for Leonardo only
  uarm.setServoSpeeds(20);
  uarm.init();          // initialize the uArm position
  
//  uarm.setServoSpeed(SERVO_R,    255);  // 0=full speed, 1-255 slower to faster
//  uarm.setServoSpeed(SERVO_L,    255);  // 0=full speed, 1-255 slower to faster
//  uarm.setServoSpeed(SERVO_ROT, 255);  // 0=full speed, 1-255 slower to faster
}

void sendPosition()
{
    Serial.print("{\"position\": [");
    Serial.print(map(uarm.readAngle(SERVO_R), SERVO_MIN, SERVO_MAX, 0, 180));
    Serial.print(",");
    Serial.print(map(uarm.readAngle(SERVO_L), SERVO_MIN, SERVO_MAX, 0, 180));
    Serial.print(",");
    Serial.print(map(uarm.readAngle(SERVO_ROT), SERVO_MIN, SERVO_MAX, 0, 180));    
        Serial.print(",");
        Serial.print(movesCompleted);
    Serial.print("]}");
    Serial.print("\r\n");
}

void loop()
{
  uarm.calibration();   // if corrected, you could remove it, no harm though
  if(Serial.available())
  {
    byte rxBuf = Serial.read();
    if(stateMachine == 0)
    {
      stateMachine = rxBuf == 0xFF? 1:0;
    }
    else if(stateMachine == 1)
    {
      if (rxBuf == 0x66)
      {
        stateMachine = 2;
      }
      else if (rxBuf == 0xAA)
      {
        stateMachine = 3;
      }
      else if (rxBuf == 0x99)
      {
        stateMachine = 4;
      }
      else {
        stateMachine = 0;
      }
    }
    else if(stateMachine == 2)
    {
      //set servo speeds
      dataBuf[counter++] = rxBuf;
      if(counter > 0)  // receive 1 byte data
      {
        stateMachine = 0;
        counter=0;
        
          int speedX = (int) dataBuf[0];
//        int speedR = (int) dataBuf[0];        
//        int speedL = (int) dataBuf[1];
//        int speedRot = (int) dataBuf[2];
        
        uarm.setServoSpeeds(speedX);  // 0=full speed, 1-255 slower to faster
        
        Serial.print("{\"speed\": ");
        Serial.print(uarm.servoSpd);
        Serial.print("}");
        Serial.print("\r\n");
        
        //uarm.setServoSpeed(SERVO_R,   speedR);  // 0=full speed, 1-255 slower to faster
        //uarm.setServoSpeed(SERVO_L,   speedL);  // 0=full speed, 1-255 slower to faster
        //uarm.setServoSpeed(SERVO_ROT, speedRot);  // 0=full speed, 1-255 slower to faster
        
        uarm.setPosition(stretchTemp, heightTemp, rotationTemp, handRotTemp);
      }
    }
    else if(stateMachine == 3)
    {
      //set servo positions
      dataBuf[counter++] = rxBuf;
      if(counter > 8)  // receive 9 byte data
      {
        stateMachine = 0;
        counter=0;
        *((char *)(&rotationTemp)  )  = dataBuf[1]; // recevive 1byte
        *((char *)(&rotationTemp)+1)  = dataBuf[0]; 
        *((char *)(&stretchTemp )  )  = dataBuf[3]; 
        *((char *)(&stretchTemp )+1)  = dataBuf[2]; 
        *((char *)(&heightTemp  )  )  = dataBuf[5]; 
        *((char *)(&heightTemp  )+1)  = dataBuf[4]; 
        *((char *)(&handRotTemp )  )  = dataBuf[7]; 
        *((char *)(&handRotTemp )+1)  = dataBuf[6]; 
        uarm.setPosition(stretchTemp, heightTemp, rotationTemp, handRotTemp);
        /* pump action, Valve Stop. */
        if(dataBuf[8] & CATCH)   uarm.gripperCatch();
        /* pump stop, Valve action. 
           Note: The air relief valve can not work for a long time, 
           should be less than ten minutes. */
        if(dataBuf[8] & RELEASE) uarm.gripperRelease();
        
        movesCompleted++;
        
        Serial.print("{\"target\": [");
        Serial.print(uarm.stretchLst);
        Serial.print(",");
        Serial.print(uarm.heightLst);
        Serial.print(",");
        Serial.print(uarm.armRotLst);
        Serial.print(",");
        Serial.print(movesCompleted);
        Serial.print("]}");
        Serial.print("\r\n");
        
      }
    }
    else if(stateMachine == 4)
    {
        stateMachine = 0;
        counter=0;
        sendPosition();
    }
  }
  
  /* delay release valve, this function must be in the main loop */
  uarm.gripperDetach();  
} 

