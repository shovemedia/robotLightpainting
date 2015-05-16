#include <HSBColor.h>

/*
Adafruit Arduino - Lesson 3. RGB LED
*/

char stateMachine = 0, counter = 0;
char dataBuf[5] = {0};

int redPin = 11;
int greenPin = 10;
int bluePin = 9;

int hue = 0;
int saturation = 255;
int brightness = 5;

int rgb[3];

//uncomment this line if using a Common Anode LED
//#define COMMON_ANODE

void setup()
{
  
  Serial.begin(9600);  // start serial port at 9600 bps
  
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);  
}

void loop()
{
  if(Serial.available())
  {
    byte rxBuf = Serial.read();
    if(stateMachine == 0)
    {
      stateMachine = rxBuf == 0xFF? 1:0;
    }
    else if(stateMachine == 1)
    {
      stateMachine = rxBuf == 0xAA? 2:0;
    }
    else if(stateMachine == 2)
    {
      dataBuf[counter++] = rxBuf;
      if(counter > 2)  // receive 3 byte data
      {
        stateMachine = 0;
        counter=0;
        
        *((char *)(&rgb[0])  )  = dataBuf[0];
        *((char *)(&rgb[1])  )  = dataBuf[1];
        *((char *)(&rgb[2])  )  = dataBuf[2]; 

        //H2R_HSBtoRGB(hue, saturation, brightness, rbg);
        setColor(rgb[0], rgb[1], rgb[2]); 
      }
    }
  }


  
}

void setColor(int red, int green, int blue)
{
  #ifdef COMMON_ANODE
    red = 255 - red;
    green = 255 - green;
    blue = 255 - blue;
  #endif
  analogWrite(redPin, red);
  analogWrite(greenPin, green);
  analogWrite(bluePin, blue);  
}
